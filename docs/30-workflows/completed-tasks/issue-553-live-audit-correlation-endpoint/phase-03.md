# Phase 3: 詳細設計 / インタフェース契約 / D1 schema / Slack payload schema / internal token authz

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 |
| Source | `outputs/phase-3/phase-3.md` |
| 区分 | 設計（型 / 関数シグネチャ / SQL DDL / Slack payload / authz 仕様を契約として確定） |
| 想定所要 | 1 人日 |

## 目的

Phase 2 で確定したモジュール配置に対して、TypeScript 型・関数シグネチャ・D1 schema DDL・Slack payload schema・internal token authz 仕様を契約として確定し、Phase 4 のテストと Phase 5 の実装が同じ契約に収束するようにする。

## 実行タスク

### 1. env schema 拡張（`apps/api/src/lib/env.ts`）

```ts
import { z } from 'zod';

export const auditCorrelationEnvSchema = z.object({
  // 既存 binding（D1）
  DB: z.custom<D1Database>(),
  // 新規追加
  GITHUB_AUDIT_PAT: z.string().min(1),
  SLACK_AUDIT_INCIDENT_WEBHOOK_URL: z.string().url(),
  AUDIT_CORRELATION_SALT: z.string().min(16),
  AUDIT_CORRELATION_INTERNAL_TOKEN: z.string().min(32),
  AUDIT_CORRELATION_RUNBOOK_BASE_URL: z.string().url(),
  AUDIT_CORRELATION_GITHUB_ORG: z.string().min(1),
  ENVIRONMENT: z.enum(['development', 'staging', 'production']).default('development'),
});

export type AuditCorrelationEnv = z.infer<typeof auditCorrelationEnvSchema>;
```

- `getEnv(c)` は parse 失敗時 throw。`runCorrelation()` 入口で catch し 503 を返す。
- secret 値を log / error message に転記しない。`z.string()` の `errorMap` で値ではなくキー名のみ表示する。

### 2. D1 schema DDL（`apps/api/migrations/NNNN_audit_correlation_findings.sql`）

```sql
-- migration: audit_correlation_findings
-- redact-safe な finding 履歴。secret / full IP / full email local-part / full UA / salt literal は保存しない。

CREATE TABLE IF NOT EXISTS audit_correlation_findings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fingerprint_hash_prefix TEXT NOT NULL,   -- SHA-256 64 hex のうち先頭 8 文字のみ保存（衝突許容）
  fingerprint_version INTEGER NOT NULL,    -- 現状 1 固定
  actor_domain TEXT,                       -- 例: 'example.com'（local-part は保存しない）
  ip_prefix TEXT,                          -- IPv4 /24 or IPv6 /48
  ua_bucket TEXT,                          -- 'chrome' | 'safari' | ... | 'other'
  severity TEXT NOT NULL CHECK (severity IN ('LOW','MEDIUM','HIGH')),
  event_type TEXT NOT NULL,                -- 例: 'org.update_member'
  reason TEXT NOT NULL,                    -- redact-safe な人間可読サマリ
  observed_at INTEGER NOT NULL,            -- finding 観測時刻 unix ms
  created_at INTEGER NOT NULL              -- row 作成時刻 unix ms
);

-- 冪等性: 同一 fingerprint_hash_prefix + observed_at + event_type は 1 row のみ
CREATE UNIQUE INDEX IF NOT EXISTS uniq_audit_corr_fp_obs_evt
  ON audit_correlation_findings(fingerprint_hash_prefix, observed_at, event_type);

-- 検索用 index
CREATE INDEX IF NOT EXISTS idx_audit_corr_severity_observed
  ON audit_correlation_findings(severity, observed_at);
```

**保存禁止カラムが含まれていないこと**を Phase 4 で grep gate / schema test の双方で検証。

### 3. 関数・型シグネチャ

#### `routes/audit-correlation/run.ts`

```ts
import { Hono } from 'hono';
import type { AuditCorrelationEnv } from '../../lib/env';

export const auditCorrelationRouter = new Hono<{ Bindings: AuditCorrelationEnv }>();

auditCorrelationRouter.post('/run', async (c) => {
  const auth = c.req.header('authorization') ?? '';
  const expected = `Bearer ${c.env.AUDIT_CORRELATION_INTERNAL_TOKEN}`;
  if (!isTimingSafeEqual(auth, expected)) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  try {
    const result = await runCorrelation({ env: c.env });
    return c.json(result, 200);
  } catch (e) {
    return c.json({ error: 'internal_error' }, 503);
  }
});

function isTimingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
```

- 401 応答 body は `{ error: 'unauthorized' }` のみ。token 値・prefix・length を漏らさない。
- 例外 stack trace は server log にのみ出し、response body には含めない。

#### `audit-correlation/run-correlation.ts`

```ts
export interface RunCorrelationDeps {
  readonly env: AuditCorrelationEnv;
  readonly now?: () => Date;
  readonly fetchImpl?: typeof fetch;
}

export interface RunCorrelationResult {
  readonly fetched: number;       // GitHub から取得した raw events 件数
  readonly persisted: number;     // D1 に insert された row 件数（UNIQUE 競合分は除く）
  readonly notifiedHigh: number;  // Slack に投げた HIGH finding 件数
}

export function runCorrelation(deps: RunCorrelationDeps): Promise<RunCorrelationResult>;
```

#### `audit-correlation/scheduled.ts`

```ts
export function scheduled(
  event: ScheduledEvent,
  env: AuditCorrelationEnv,
  ctx: ExecutionContext
): void {
  ctx.waitUntil(runCorrelation({ env }).catch((e) => {
    console.error('audit-correlation scheduled failed', { name: e?.name });
    // throw しない: 次の cron cycle (15 分後) で自動再試行
  }));
}
```

#### `audit-correlation/persist.ts`

```ts
import type { CorrelatedFinding } from './types';

export interface PersistOpts {
  readonly db: D1Database;
  readonly now?: () => Date;
}

export interface PersistResult {
  readonly attempted: number;
  readonly inserted: number;   // UNIQUE 競合で skip された row は inserted に含めない
}

export function persistFindings(
  findings: ReadonlyArray<CorrelatedFinding>,
  opts: PersistOpts
): Promise<PersistResult>;
```

- 内部実装方針:
  - `INSERT OR IGNORE INTO audit_correlation_findings (...) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` で UNIQUE 競合を冪等に処理。
  - `fingerprint_hash_prefix` は finding 内最初の event の `fingerprintHash.slice(0, 8)`。
  - `actor_domain` / `ip_prefix` / `ua_bucket` は finding 内最初の event のもの（同一 fingerprint なので一意）。
  - `event_type` は HIGH 判定根拠 event の type を採用（複数あれば優先順位 = GitHub 権限変更 > Cloudflare token_rotate > Cloudflare login_fail）。

#### `audit-correlation/notify-slack.ts`

```ts
import type { CorrelatedFinding } from './types';

export interface SlackNotifyOpts {
  readonly webhookUrl: string;          // 値は payload 内に転記しない
  readonly runbookBaseUrl: string;
  readonly environment: 'development' | 'staging' | 'production';
  readonly fetchImpl?: typeof fetch;
}

export interface SlackNotifyResult {
  readonly attempted: number;
  readonly succeeded: number;
}

export function notifyHighFindingsToSlack(
  findings: ReadonlyArray<CorrelatedFinding>,
  opts: SlackNotifyOpts
): Promise<SlackNotifyResult>;
```

#### `audit-correlation/runbook-url.ts`

```ts
export type RunbookAnchor =
  | 'permission-change-with-ip-shift'
  | 'token-rotate-without-permission-change'
  | 'login-fail-burst'
  | 'unknown';

export function pickRunbookAnchor(finding: CorrelatedFinding): RunbookAnchor;

export function buildRunbookUrl(baseUrl: string, anchor: RunbookAnchor): string;
// 例: `${baseUrl}#${anchor}`
```

### 4. Slack payload schema（incoming webhook 形式）

```ts
interface SlackIncomingWebhookPayload {
  text: string;                          // fallback。redact-safe summary
  blocks: ReadonlyArray<{
    type: 'section';
    fields: ReadonlyArray<{ type: 'mrkdwn'; text: string }>;
  } | {
    type: 'actions';
    elements: ReadonlyArray<{
      type: 'button';
      text: { type: 'plain_text'; text: 'Open Runbook' };
      url: string;                       // 公開 runbook URL のみ。webhook URL 自体は転記しない
    }>;
  }>;
}
```

**payload に含めて良い値**:
- `fingerprintHashPrefix`（先頭 8 文字のみ）
- `actorDomain`（local-part なし）
- `ipPrefix`（/24 or /48）
- `userAgentBucket`（ラベルのみ）
- `severity` / `eventType` / `reason` / `observedAt`（ISO8601）
- `environment`（'staging' | 'production'）
- runbook URL（`AUDIT_CORRELATION_RUNBOOK_BASE_URL` + anchor）

**payload に含めてはいけない値**:
- secret 値全般 / 完全 IP / actor email の local-part / 完全 UA / salt 値 / webhook URL 値そのもの / PAT 値 / internal token 値 / 完全 fingerprint hash（64 文字）

### 5. internal token authz 仕様

| 項目 | 仕様 |
| --- | --- |
| header | `Authorization: Bearer <AUDIT_CORRELATION_INTERNAL_TOKEN>` |
| 比較方法 | timing-safe（長さ check 後 XOR 累積、`===` 禁止） |
| 401 body | `{ "error": "unauthorized" }` のみ |
| token 長 | 32 文字以上（`z.string().min(32)`） |
| scheduled handler | token 不要（Worker 内部 event のみ） |
| log 出力 | header / token を log に出さない（`name` 等の例外メタのみ） |

### 6. エラー処理境界

| 発生箇所 | 例外 | route 応答 | scheduled 応答 |
| --- | --- | --- | --- |
| `getEnv` parse 失敗 | `ZodError` | 503 `internal_error` | log のみ（次 cron 持ち越し） |
| GitHub 401/403 | `AuditFetchAuthError`（既存） | 503 `internal_error` | 同上 |
| GitHub 429 リトライ尽き | `AuditFetchRateLimitError`（既存 / 新規） | 503 `internal_error` | 同上 |
| D1 write 失敗 | rethrow | 503 `internal_error` | 同上 |
| Slack 投稿失敗 | catch + log | 200 `notifiedHigh` 不一致は許容 | 同左 |

## 変更対象ファイル

| パス | 種別 | 役割 |
| --- | --- | --- |
| `apps/api/src/lib/env.ts` | 編集 | `auditCorrelationEnvSchema` 追加 / `getEnv()` 拡張 |
| `apps/api/src/routes/audit-correlation/run.ts` | 新規 | route + timing-safe authz |
| `apps/api/src/routes/audit-correlation/index.ts` | 新規 | barrel |
| `apps/api/src/audit-correlation/scheduled.ts` | 新規 | scheduled handler |
| `apps/api/src/audit-correlation/run-correlation.ts` | 新規 | orchestration |
| `apps/api/src/audit-correlation/persist.ts` | 新規 | D1 INSERT OR IGNORE |
| `apps/api/src/audit-correlation/notify-slack.ts` | 新規 | webhook POST + redact-safe payload |
| `apps/api/src/audit-correlation/runbook-url.ts` | 新規 | anchor / URL 純関数 |
| `apps/api/src/audit-correlation/types.ts` | 編集（必要時） | `RunCorrelationDeps` / `PersistOpts` 等の追加 |
| `apps/api/migrations/NNNN_audit_correlation_findings.sql` | 新規 | 上記 DDL |

## 入出力・副作用

- 詳細は Phase 2 「入出力・副作用」表を契約化したものを `outputs/phase-3/phase-3.md` に再掲。
- 重要不変条件:
  - `persist.ts` は redact-safe カラムのみ INSERT。secret / 完全 IP / 完全 email / 完全 UA を bind parameter にしない。
  - `notify-slack.ts` は webhook URL 値そのものを payload / log に出さない（`fetch(url, ...)` の引数として使うのみ）。
  - `route/run.ts` は token / Authorization header を log に出さない。

## テスト方針

Phase 4 で以下契約に対する vitest / bats を配置:
- env schema parse 失敗 → throw
- timing-safe 比較が同長異値 / 短値 / 完全一致それぞれで正しく分岐
- D1 INSERT OR IGNORE による UNIQUE 冪等
- Slack payload に保存禁止値が含まれない（grep gate）
- runbook URL の anchor 切替（HIGH 種別ごと）

## ローカル実行・検証コマンド

```bash
# zod schema が parse できることの単発確認（実装後 Phase 5）
mise exec -- pnpm --filter @ubm/api typecheck

# D1 migration の SQL syntax 確認（dry-run / staging 適用は Phase 9）
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging

# Slack incoming webhook payload の手書き確認（実値は使わず JSON 構造のみ）
mise exec -- pnpm --filter @ubm/api test src/audit-correlation/__tests__/notify-slack.test.ts
```

## 統合テスト連携

- Phase 4 は本 Phase の関数シグネチャ・SQL DDL・Slack payload schema・authz 仕様を契約として vitest / bats 化する。
- Phase 5 実装は本 Phase の型と DDL を逸脱しない。
- Phase 7 CI gate は本 Phase の「保存禁止 / payload 禁止」リストを grep gate の禁止パターン source として使う。

## 参照資料

- Phase 1 / Phase 2 outputs
- 親 Phase 3: `docs/30-workflows/completed-tasks/issue-516-github-audit-log-cross-source-correlation/phase-03.md`
- `apps/api/src/audit-correlation/types.ts`（既存型）
- Slack incoming webhooks 仕様（block kit）
- Cloudflare D1 SQL constraints / `INSERT OR IGNORE`
- CLAUDE.md「`apps/api` env アクセス不変条件」「Cloudflare 系 CLI 実行ルール」

## 成果物

- `outputs/phase-3/phase-3.md`
  - env schema 拡張定義
  - D1 schema DDL（保存可カラムのみ）
  - 5 関数シグネチャ（`runCorrelation` / `scheduled` / `persistFindings` / `notifyHighFindingsToSlack` / `pickRunbookAnchor` + `buildRunbookUrl`）
  - Slack payload schema（保存可 / 禁止リスト含む）
  - internal token authz 表（header / 比較 / 401 body / token 長 / scheduled 例外）
  - エラー処理境界表

## 完了条件（DoD）

- [ ] `auditCorrelationEnvSchema` が 6 secret / var を含み、parse 失敗時の挙動が明文化されている。
- [ ] `audit_correlation_findings` table の DDL に保存禁止カラム（full IP / 完全 email / 完全 UA / salt / webhook URL / PAT / internal token / 完全 fingerprint hash）が含まれない。
- [ ] `runCorrelation` / `scheduled` / `persistFindings` / `notifyHighFindingsToSlack` / `pickRunbookAnchor` / `buildRunbookUrl` の TypeScript シグネチャが確定。
- [ ] Slack payload schema に「含めて良い値」「含めてはいけない値」が表で明示されている。
- [ ] internal token authz が timing-safe 比較・token 32 文字以上・401 body redact 仕様で固定されている。
- [ ] エラー処理境界（route / scheduled での例外応答）が表で明文化されている。
- [ ] `INSERT OR IGNORE` + UNIQUE index による冪等性方針が明示されている。

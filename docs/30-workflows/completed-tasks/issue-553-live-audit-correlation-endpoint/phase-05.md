# Phase 5: コア実装（route / scheduled / run-correlation / persist / notify-slack / runbook-url）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 |
| Source | `outputs/phase-5/phase-5.md` |
| 区分 | 実装（apps/api Cloudflare Worker live wiring） |
| 想定所要 | 1.5 人日 |

## 目的

Phase 3 の契約と Phase 4 の契約テストを満たす live wiring コア実装を `apps/api/` 配下に追加する。具体的には、Hono route（`POST /internal/audit-correlation/run`）、Worker `scheduled` event handler、両 entry が共通で呼ぶ orchestration（`runCorrelation()`）、redact-safe な D1 永続化、HIGH severity 限定の Slack incoming webhook 通知、runbook URL 組み立てを実装する。`getEnv()` 経由の env 参照と redact-safe 不変条件（secret / full IP / full email / full UA / salt literal / Slack webhook URL を log・D1・Slack payload に出さない）を全関数で徹底する。

親タスク Issue #516 の Phase 5 で確定した既存実装（`github-fetch.ts` / `redact.ts` / `correlate.ts` / `types.ts` / `errors.ts`）はそのまま再利用し、本 Phase では「live wiring に必要な orchestration / route / persist / notify / scheduled handler / runbook URL 組み立て」のみを追加する。

## 実行タスク

1. **D1 migration 追加** — `apps/api/migrations/0017_audit_correlation_findings.sql` を新規作成し、redact-safe 列のみで `audit_correlation_findings` テーブルを定義する。
2. **runbook-url 純関数実装** — `apps/api/src/audit-correlation/runbook-url.ts` に finding 種別 → runbook anchor URL 組み立て純関数を実装する。
3. **persist 実装** — `apps/api/src/audit-correlation/persist.ts` に D1 binding 経由の redact-safe insert を実装する。
4. **notify-slack 実装** — `apps/api/src/audit-correlation/notify-slack.ts` に HIGH severity 限定の Slack incoming webhook 投稿を実装する。
5. **run-correlation orchestration 実装** — `apps/api/src/audit-correlation/run-correlation.ts` に `github-fetch` → `correlate` → `persist` → `notify-slack` の orchestration を実装する。
6. **scheduled handler 実装** — `apps/api/src/audit-correlation/scheduled.ts` に Worker `scheduled` event handler を実装する。
7. **Hono route 実装** — `apps/api/src/routes/audit-correlation/run.ts` および `apps/api/src/routes/audit-correlation/index.ts` を実装する。
8. **`apps/api/src/index.ts` 編集** — `auditCorrelationRouter` を `app.route('/internal/audit-correlation', auditCorrelationRouter)` で登録し、`scheduled` export を追加する。
9. **契約テスト追加** — `apps/api/src/audit-correlation/__tests__/{run-correlation,persist,notify-slack,run-route}.test.ts` を実装し、すべて green にする。

## 変更対象ファイル

| パス | 種別 | 役割 |
| --- | --- | --- |
| `apps/api/migrations/0017_audit_correlation_findings.sql` | 新規 | D1 schema migration（redact-safe 列のみ） |
| `apps/api/src/audit-correlation/runbook-url.ts` | 新規 | finding 種別 → runbook anchor URL を組み立てる純関数 |
| `apps/api/src/audit-correlation/persist.ts` | 新規 | D1 binding 経由の redact-safe insert |
| `apps/api/src/audit-correlation/notify-slack.ts` | 新規 | Slack incoming webhook 投稿（HIGH のみ） |
| `apps/api/src/audit-correlation/run-correlation.ts` | 新規 | route と scheduled の共通 orchestration |
| `apps/api/src/audit-correlation/scheduled.ts` | 新規 | Worker `scheduled` event handler |
| `apps/api/src/routes/audit-correlation/run.ts` | 新規 | Hono route: `POST /internal/audit-correlation/run` |
| `apps/api/src/routes/audit-correlation/index.ts` | 新規 | barrel export（router） |
| `apps/api/src/index.ts` | 編集 | router マウント + `scheduled` export |
| `apps/api/src/audit-correlation/__tests__/run-correlation.test.ts` | 新規 | orchestration 契約テスト |
| `apps/api/src/audit-correlation/__tests__/persist.test.ts` | 新規 | redact-safe insert 契約テスト |
| `apps/api/src/audit-correlation/__tests__/notify-slack.test.ts` | 新規 | Slack payload 契約テスト |
| `apps/api/src/audit-correlation/__tests__/run-route.test.ts` | 新規 | Hono route authz 契約テスト |

## 実装手順

### 1. `apps/api/migrations/0017_audit_correlation_findings.sql`

既存最大連番 `0016_cf_audit_log_classification.sql` の次に当たる `0017` を採番。redact-safe 列のみを定義する（fingerprint hash の `prefix` 8 文字 + version + actorDomain + ipPrefix + uaBucket + severity + eventType + observedAt + createdAt）。

```sql
-- 0017_audit_correlation_findings.sql
-- redact-safe 列のみ。full IP / full email / full UA / salt / secret / webhook URL は格納禁止。
CREATE TABLE IF NOT EXISTS audit_correlation_findings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fingerprint_hash_prefix TEXT NOT NULL,    -- SHA-256 hex の先頭 8 文字のみ
  fingerprint_version INTEGER NOT NULL,     -- またぎ運用のため version を記録
  actor_domain TEXT NOT NULL,               -- email の domain 部のみ（local-part は格納しない）
  ip_prefix TEXT NOT NULL,                  -- IPv4 は 3 octet / IPv6 は 3 hextet
  ua_bucket TEXT NOT NULL,                  -- chrome / safari / firefox / curl / gha-runner / other
  severity TEXT NOT NULL CHECK (severity IN ('HIGH','MEDIUM','LOW')),
  event_type TEXT NOT NULL,                 -- org.update_member など正規化済 event type
  observed_at INTEGER NOT NULL,             -- finding の observedAt (epoch ms)
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER) * 1000)
);

CREATE INDEX IF NOT EXISTS idx_audit_correlation_findings_observed_at
  ON audit_correlation_findings(observed_at);
CREATE INDEX IF NOT EXISTS idx_audit_correlation_findings_severity_observed_at
  ON audit_correlation_findings(severity, observed_at);
```

### 2. `apps/api/src/audit-correlation/runbook-url.ts`

```ts
const RUNBOOK_BASE = 'https://github.com/daishiman/UBM-Hyogo/blob/main/docs/runbooks/audit-correlation.md';

export function buildRunbookUrl(eventType: string, severity: 'HIGH' | 'MEDIUM' | 'LOW'): string {
  // event type は ASCII 英数字 + . + _ のみ通す（XSS / 不正 fragment 防止）
  const safeAnchor = eventType.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
  return `${RUNBOOK_BASE}#severity-${severity.toLowerCase()}-${safeAnchor}`;
}
```

副作用なし、純関数。salt / webhook URL / PAT 等 secret を含まない定数のみ参照。

### 3. `apps/api/src/audit-correlation/persist.ts`

```ts
import type { CorrelatedFinding } from './types';

export interface PersistDeps {
  db: D1Database;
  now: () => number; // testability のため inject
}

export async function persistFindings(
  findings: ReadonlyArray<CorrelatedFinding>,
  deps: PersistDeps
): Promise<{ inserted: number }> {
  if (findings.length === 0) return { inserted: 0 };
  const stmt = deps.db.prepare(
    `INSERT INTO audit_correlation_findings
      (fingerprint_hash_prefix, fingerprint_version, actor_domain, ip_prefix, ua_bucket,
       severity, event_type, observed_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const now = deps.now();
  const batch = findings.map((f) =>
    stmt.bind(
      f.fingerprintHash.slice(0, 8),  // prefix 8 文字のみ
      f.fingerprintVersion,
      f.actorDomain,
      f.ipPrefix,
      f.uaBucket,
      f.severity,
      f.eventType,
      f.observedAt,
      now
    )
  );
  await deps.db.batch(batch);
  return { inserted: findings.length };
}
```

不変条件:
- `fingerprintHash` 全長 / `salt` / full email local-part / full IP / full UA / webhook URL / PAT は **bind しない**。
- failure 時の error message に bind 値を含めない（D1 driver の throw をそのまま投げ直さず、`AuditPersistError`（短文）にラップする実装でも可）。

### 4. `apps/api/src/audit-correlation/notify-slack.ts`

```ts
import type { CorrelatedFinding } from './types';
import { buildRunbookUrl } from './runbook-url';

export interface SlackNotifyDeps {
  webhookUrl: string;          // env 経由でのみ受け取る。log 出力禁止
  fetch: typeof globalThis.fetch;
  channelLabel: 'production' | 'dry-run';
}

export async function notifySlackForHighFindings(
  findings: ReadonlyArray<CorrelatedFinding>,
  deps: SlackNotifyDeps
): Promise<{ posted: number }> {
  const high = findings.filter((f) => f.severity === 'HIGH');
  if (high.length === 0) return { posted: 0 };

  let posted = 0;
  for (const f of high) {
    const payload = {
      text: `[audit-correlation:${deps.channelLabel}] HIGH finding detected`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: [
              `*severity*: HIGH`,
              `*event_type*: ${f.eventType}`,
              `*fingerprint*: ${f.fingerprintHash.slice(0, 8)} (v${f.fingerprintVersion})`,
              `*actor_domain*: ${f.actorDomain}`,
              `*ip_prefix*: ${f.ipPrefix}`,
              `*ua_bucket*: ${f.uaBucket}`,
              `*runbook*: <${buildRunbookUrl(f.eventType, 'HIGH')}|open runbook>`,
            ].join('\n'),
          },
        },
      ],
    };
    const res = await deps.fetch(deps.webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      // 本文 / webhook URL / PAT 等 secret を含まない短文 throw
      throw new Error(`slack webhook responded ${res.status}`);
    }
    posted += 1;
  }
  return { posted };
}
```

不変条件:
- payload に `fingerprintHash` 全長 / `salt` / full email / full IP / full UA / webhook URL 自体 を入れない。
- `webhookUrl` を error message / console.log に出さない。
- production / dry-run channel は呼び出し側（run-correlation）で `getEnv()` の `AUDIT_CORRELATION_SLACK_CHANNEL_LABEL` を渡し分岐する。

### 5. `apps/api/src/audit-correlation/run-correlation.ts`

```ts
import { fetchGitHubAuditEvents } from './github-fetch';
import { redactGitHub, redactCloudflare, computeFingerprint } from './redact';
import { correlate } from './correlate';
import { persistFindings } from './persist';
import { notifySlackForHighFindings } from './notify-slack';
import type { CorrelatedFinding } from './types';

export interface RunCorrelationEnv {
  DB: D1Database;
  GITHUB_AUDIT_PAT: string;
  AUDIT_CORRELATION_SALT: string;
  SLACK_AUDIT_INCIDENT_WEBHOOK_URL: string;
  AUDIT_CORRELATION_SLACK_CHANNEL_LABEL: 'production' | 'dry-run';
  GITHUB_AUDIT_ORG: string;
  // Cloudflare 側 finding は Issue #408 の出力 (R2 / D1 / API いずれか) から取得
  cloudflareEventsLoader: () => Promise<ReadonlyArray<unknown>>;
  // testability
  fetch?: typeof globalThis.fetch;
  now?: () => number;
}

export async function runCorrelation(
  env: RunCorrelationEnv
): Promise<{ findings: number; high: number; persisted: number; slackPosted: number }> {
  const fetchImpl = env.fetch ?? globalThis.fetch;
  const now = env.now ?? Date.now;

  // 1. fetch
  const githubRaw = await fetchGitHubAuditEvents({
    org: env.GITHUB_AUDIT_ORG,
    pat: env.GITHUB_AUDIT_PAT,
    fetch: fetchImpl,
  });
  const cloudflareRaw = await env.cloudflareEventsLoader();

  // 2. redact + fingerprint
  const redactOpts = { salt: env.AUDIT_CORRELATION_SALT, computeFingerprint };
  const githubNorm = await Promise.all(githubRaw.map((e) => redactGitHub(e, redactOpts)));
  const cloudflareNorm = await Promise.all(
    cloudflareRaw.map((e) => redactCloudflare(e as never, redactOpts))
  );

  // 3. correlate
  const findings: ReadonlyArray<CorrelatedFinding> = correlate(githubNorm, cloudflareNorm);

  // 4. persist (redact-safe)
  const { inserted } = await persistFindings(findings, { db: env.DB, now });

  // 5. notify slack (HIGH only)
  const { posted } = await notifySlackForHighFindings(findings, {
    webhookUrl: env.SLACK_AUDIT_INCIDENT_WEBHOOK_URL,
    fetch: fetchImpl,
    channelLabel: env.AUDIT_CORRELATION_SLACK_CHANNEL_LABEL,
  });

  return {
    findings: findings.length,
    high: findings.filter((f) => f.severity === 'HIGH').length,
    persisted: inserted,
    slackPosted: posted,
  };
}
```

不変条件:
- env を受け取る形にし、route / scheduled の双方から同一 entry を呼び出せる構造とする。
- 呼び出し元は `getEnv()` 経由で env を構築し、`process.env.*` を直接参照しない。

### 6. `apps/api/src/audit-correlation/scheduled.ts`

```ts
import { runCorrelation } from './run-correlation';
import { getEnv } from '../lib/env'; // Cloudflare binding を validate して返す既存ヘルパー

export async function handleScheduled(
  event: ScheduledEvent,
  cfEnv: unknown,
  ctx: ExecutionContext
): Promise<void> {
  const env = getEnv(cfEnv); // validate (zod)
  ctx.waitUntil(
    runCorrelation({
      DB: env.DB,
      GITHUB_AUDIT_PAT: env.GITHUB_AUDIT_PAT,
      AUDIT_CORRELATION_SALT: env.AUDIT_CORRELATION_SALT,
      SLACK_AUDIT_INCIDENT_WEBHOOK_URL: env.SLACK_AUDIT_INCIDENT_WEBHOOK_URL,
      AUDIT_CORRELATION_SLACK_CHANNEL_LABEL: env.AUDIT_CORRELATION_SLACK_CHANNEL_LABEL,
      GITHUB_AUDIT_ORG: env.GITHUB_AUDIT_ORG,
      cloudflareEventsLoader: async () => [], // 暫定: Issue #408 連携は別 PR
    }).then((summary) => {
      // log は redact-safe な集計値のみ。secret / fingerprint 全長を出さない
      console.log(JSON.stringify({ at: 'audit-correlation.scheduled', ...summary }));
    })
  );
}
```

### 7. `apps/api/src/routes/audit-correlation/run.ts` + `index.ts`

```ts
// run.ts
import { Hono } from 'hono';
import { runCorrelation } from '../../audit-correlation/run-correlation';
import { getEnv } from '../../lib/env';

export const auditCorrelationRouter = new Hono();

auditCorrelationRouter.post('/run', async (c) => {
  const env = getEnv(c.env);
  // internal token authz: `Authorization: Bearer <token>` を timing-safe 比較
  const provided = c.req.header('authorization') ?? '';
  const expected = env.AUDIT_CORRELATION_INTERNAL_TOKEN;
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  const summary = await runCorrelation({
    DB: env.DB,
    GITHUB_AUDIT_PAT: env.GITHUB_AUDIT_PAT,
    AUDIT_CORRELATION_SALT: env.AUDIT_CORRELATION_SALT,
    SLACK_AUDIT_INCIDENT_WEBHOOK_URL: env.SLACK_AUDIT_INCIDENT_WEBHOOK_URL,
    AUDIT_CORRELATION_SLACK_CHANNEL_LABEL: env.AUDIT_CORRELATION_SLACK_CHANNEL_LABEL,
    GITHUB_AUDIT_ORG: env.GITHUB_AUDIT_ORG,
    cloudflareEventsLoader: async () => [],
  });
  return c.json({ ok: true, ...summary });
});

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
```

```ts
// index.ts
export { auditCorrelationRouter } from './run';
```

### 8. `apps/api/src/index.ts` への統合

```ts
import { auditCorrelationRouter } from './routes/audit-correlation';
import { handleScheduled } from './audit-correlation/scheduled';

// app は既存の Hono インスタンス
app.route('/internal/audit-correlation', auditCorrelationRouter);

export default {
  fetch: app.fetch,
  scheduled: handleScheduled,
};
```

## 入出力・副作用

| 関数 | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `buildRunbookUrl` | eventType, severity | string URL | なし（純関数） |
| `persistFindings` | findings, {db, now} | `{ inserted }` | D1 INSERT |
| `notifySlackForHighFindings` | findings, {webhookUrl, fetch, channelLabel} | `{ posted }` | Slack webhook POST |
| `runCorrelation` | env | summary 集計 | network I/O + D1 + Slack |
| `handleScheduled` | event, cfEnv, ctx | void | `runCorrelation` を `ctx.waitUntil` 経由で起動 |
| Hono `POST /run` | request | JSON response | authz → `runCorrelation` |

## テスト方針

| テストファイル | 主要ケース |
| --- | --- |
| `__tests__/run-correlation.test.ts` | mock D1 + msw fetch + mock Slack で「HIGH finding 1 件 → persist 1 / slack 1」「LOW のみ → slack 0」「fetch 401 → AuditFetchAuthError 伝搬」 |
| `__tests__/persist.test.ts` | bind 値に full hash / salt / webhook URL / full email / full IP / full UA が含まれない grep gate（テスト内 spy で全 bind 値を捕捉して assert） |
| `__tests__/notify-slack.test.ts` | HIGH only filter / payload に webhook URL・PAT・salt 非露出 / dry-run channel label 反映 / non-2xx で throw（error message に webhook URL を含まない） |
| `__tests__/run-route.test.ts` | 401（token missing / mismatch）/ 200（一致）/ length mismatch でも 401 / `runCorrelation` 呼び出し回数 |

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint
mise exec -- pnpm --filter @ubm-hyogo/api test src/audit-correlation
mise exec -- pnpm --filter @ubm-hyogo/api test src/routes/audit-correlation

# D1 migration の dry-run（staging）
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging
```

## 統合テスト連携

- 上流: Phase 4 で確定した契約テストの assertion をそのまま使用。
- 下流: Phase 6 の `scripts/audit-correlation/run.sh --mode=live` から本 Phase の `runCorrelation()` を呼び出すため、export shape を Phase 6 と整合させる。Phase 7 の grep gate は、本 Phase で書いた D1 schema / Slack payload に対しても適用される。

## 参照資料

- `docs/30-workflows/issue-553-live-audit-correlation-endpoint/index.md`
- `docs/30-workflows/issue-553-live-audit-correlation-endpoint/phase-03.md`（型契約）
- `docs/30-workflows/issue-553-live-audit-correlation-endpoint/phase-04.md`（テスト設計）
- `docs/30-workflows/completed-tasks/issue-516-github-audit-log-cross-source-correlation/phase-05.md`（fixture 実装の正本）
- CLAUDE.md「`apps/web` env アクセス不変条件」「Cloudflare 系 CLI 実行ルール」
- Cloudflare Workers `scheduled` handler / D1 binding / Web Crypto `subtle.timingSafeEqual` 代替

## 成果物（`outputs/phase-5/phase-5.md`）

- 上記 13 ファイルの実装本体（migration 含む）
- 採番した migration filename（`0017_audit_correlation_findings.sql`）の決定根拠
- internal token authz の constant-time 比較採用根拠
- `cloudflareEventsLoader` を仮 `async () => []` にした暫定判断と Issue #408 連携 follow-up の予定

## 完了条件（DoD）

- [ ] `apps/api/migrations/0017_audit_correlation_findings.sql` が新規作成され、redact-safe 列のみで構成されている。
- [ ] `runbook-url.ts` / `persist.ts` / `notify-slack.ts` / `run-correlation.ts` / `scheduled.ts` / `routes/audit-correlation/{run,index}.ts` が新規実装されている。
- [ ] `apps/api/src/index.ts` に router マウント + `scheduled` export が追加されている。
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` clean。
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api lint` clean。
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test src/audit-correlation` および `src/routes/audit-correlation` が green。
- [ ] persist / notify-slack の bind 値・payload に full hash / salt / webhook URL / full email / full IP / full UA / PAT が含まれないこと（テスト内 grep gate で恒久化）。
- [ ] env 参照はすべて `getEnv()` 経由であり、`process.env.*` の直接参照がない（grep 確認）。
- [ ] migration は `bash scripts/cf.sh d1 migrations apply` 経由で適用方針が runbook と整合（実適用は Phase 9）。

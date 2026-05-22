# Phase 4: テストファースト設計 / 契約テスト / grep gate / live mode dry-run

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 |
| Source | `outputs/phase-4/phase-4.md` |
| 区分 | テスト設計（テストコードは Phase 5 と並行で red → green） |
| 想定所要 | 1 人日 |

## 目的

Phase 3 の契約（route authz / persist redact-safe insert / notify-slack payload / orchestration / Slack best-effort / runbook URL anchor / internal token timing-safe）に対する vitest / bats を先に整備し、Phase 5 実装が green になるまでの red baseline を作る。grep gate（secret / 完全 IP / 完全 email / 完全 UA / salt literal / webhook URL）を CI で恒久化する設計を確定する。

## 実行タスク

### 1. 追加テストファイル一覧

| ファイル | フレームワーク | 主目的 |
| --- | --- | --- |
| `apps/api/src/routes/audit-correlation/__tests__/run-route.test.ts` | vitest | route authz 401 / 200 / 503 + redact-safe response body |
| `apps/api/src/audit-correlation/__tests__/persist.test.ts` | vitest | D1 redact-safe insert / `INSERT OR IGNORE` 冪等 / 保存禁止カラム grep |
| `apps/api/src/audit-correlation/__tests__/notify-slack.test.ts` | vitest | Slack payload redact-safe / best-effort（webhook 失敗で throw しない） |
| `apps/api/src/audit-correlation/__tests__/run-correlation.test.ts` | vitest | orchestration mock（fetch + D1 + Slack 全 mock）/ 失敗時挙動 |
| `apps/api/src/audit-correlation/__tests__/runbook-url.test.ts` | vitest | finding 種別 → anchor 切替の純関数テスト |
| `scripts/audit-correlation/__tests__/live-mode.bats` | bats | `run.sh --mode=live` の dry-run / grep gate / fixture mode 据え置き |

### 2. テストケース ID（TC-LIVE-NN）

| ID | 対象 | 入力 | 期待 |
| --- | --- | --- | --- |
| TC-LIVE-01 | `run-route` authz | `Authorization` header なし | 401 `{ error: 'unauthorized' }` |
| TC-LIVE-02 | `run-route` authz | `Bearer wrong-token`（同長異値） | 401 `{ error: 'unauthorized' }` |
| TC-LIVE-03 | `run-route` authz | `Bearer wrong`（短値） | 401 `{ error: 'unauthorized' }` |
| TC-LIVE-04 | `run-route` authz | `Bearer <expected>` | 200 `{ fetched, persisted, notifiedHigh }` |
| TC-LIVE-05 | `run-route` authz | 401 応答 body に token / token prefix / token length が含まれない | 含まない |
| TC-LIVE-06 | `run-route` 例外 | `runCorrelation` が throw | 503 `{ error: 'internal_error' }`（stack を出さない） |
| TC-LIVE-07 | `persist` insert | finding 1 件 | `audit_correlation_findings` に 1 row、保存禁止カラムなし |
| TC-LIVE-08 | `persist` 冪等 | 同一 finding 2 回 insert | inserted 件数 = 1（UNIQUE 競合 skip） |
| TC-LIVE-09 | `persist` redact | finding に完全 IP / 完全 UA / 完全 email を渡しても row には ipPrefix / uaBucket / actorDomain しか入らない | 含まない |
| TC-LIVE-10 | `persist` redact grep | insert 後の row を `SELECT *` で取得し、IPv4 完全形式 / `User-Agent: ` プレフィクス / `ghp_` / `github_pat_` が含まれない | 含まない |
| TC-LIVE-11 | `notify-slack` payload | HIGH finding 1 件 | Slack webhook が 1 回 POST、payload に runbook URL 含む |
| TC-LIVE-12 | `notify-slack` redact | payload JSON 文字列化に完全 IP / 完全 email / 完全 UA / salt literal / webhook URL 値が含まれない | 含まない |
| TC-LIVE-13 | `notify-slack` best-effort | webhook fetch が 500 / network error | throw せず `succeeded < attempted` を返す |
| TC-LIVE-14 | `notify-slack` HIGH 限定 | LOW / MEDIUM finding を渡しても POST されない | POST されない |
| TC-LIVE-15 | `runbook-url` anchor | 権限変更 + IP 急変 finding | `permission-change-with-ip-shift` |
| TC-LIVE-16 | `runbook-url` anchor | token_rotate 単独 | `token-rotate-without-permission-change` |
| TC-LIVE-17 | `runbook-url` URL | base + anchor | `${base}#${anchor}` |
| TC-LIVE-18 | `run-correlation` orchestration | fetch 成功 / persist 成功 / notify 成功 | `RunCorrelationResult` の 3 値が一致 |
| TC-LIVE-19 | `run-correlation` Slack 失敗 | fetch / persist 成功 / notify 内部失敗 | `notifiedHigh < HIGH 件数`、route は 200 |
| TC-LIVE-20 | `run-correlation` env 不正 | `getEnv` が throw | 上位（route）で 503 |
| TC-LIVE-21 | bats live mode | `run.sh --mode=live --dry-run` | exit 0、stdout に webhook URL / PAT / salt 値が含まれない |
| TC-LIVE-22 | bats fixture mode 据え置き | `run.sh`（既存呼び出し） | 既存挙動から regression なし |

### 3. mock / fixture 戦略

- **`run-route.test.ts`**: Hono `app.request()` で in-process テスト。`runCorrelation` を vitest `vi.mock` で stub。env は zod schema が parse 通る最小ダミー（token は 32 文字以上のダミー固定文字列、webhook URL は `https://example.invalid/`）。
- **`persist.test.ts`**: `better-sqlite3` 互換の in-memory D1 mock（`@miniflare/d1` または既存 test 基盤）。migration SQL を beforeAll で apply。
- **`notify-slack.test.ts`**: `fetchImpl` を `vi.fn()` で注入。レスポンス 200 / 500 / reject の 3 ケース。payload は実 fetch 引数を capture して JSON.stringify 後に grep。
- **`run-correlation.test.ts`**: `fetchImpl` / `env.DB` / `notifyHighFindingsToSlack` をすべて mock。GitHub fetch を fixture 配列で stub し、persist は in-memory D1、notify は spy。
- **`runbook-url.test.ts`**: 純関数テスト。fixture finding を 4 種（権限変更+IP急変 / token_rotate / login_fail / unknown）。
- **`live-mode.bats`**: `--dry-run` flag で実 webhook / 実 PAT を使わずに stdout 出力のみ生成し、`grep -E` で禁止パターン否定検査。

### 4. grep gate 禁止パターン（CI 恒久化）

| パターン | 検出箇所 | 例外 |
| --- | --- | --- |
| `\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b` | D1 row dump / Slack payload / log | `0.0.0.0` / `127.0.0.1` の test fixture は除外（test 内のみ） |
| `User-Agent: .+` | 同上 | なし |
| `(ghp_|github_pat_)[A-Za-z0-9_]{20,}` | 同上 | なし |
| `xoxb-[A-Za-z0-9-]+` (Slack bot token) | 同上 | なし |
| `https://hooks\.slack\.com/services/[A-Za-z0-9/]+` | 同上 | webhook URL 値そのものは保存・出力しない |
| `(?i)AUDIT_CORRELATION_SALT\s*=\s*[A-Za-z0-9]+` | 同上 | salt literal の env 形式露出禁止 |
| 64 hex chars 連続 | Slack payload | 完全 fingerprint hash 露出禁止（prefix 8 まで） |

### 5. 重要不変条件のテスト化

| 不変条件 | テスト ID |
| --- | --- |
| `apps/web` から D1 直接アクセス禁止 | 本タスクは `apps/api` 配下のみ変更（grep gate で `apps/web/**` に D1 binding 参照が増えていないことを確認 / Phase 7 で恒久化） |
| `apps/api` の env 参照は `getEnv()` のみ | `grep -RE "process\.env\." apps/api/src/audit-correlation apps/api/src/routes/audit-correlation` が空（Phase 7 で恒久化） |
| Cloudflare CLI は `scripts/cf.sh` 経由 | bats live-mode 内で `wrangler` 直接呼び出しがないこと |
| 平文 secret / PAT / webhook URL を仕様書に書かない | TC-LIVE-12 / TC-LIVE-21 |
| redact-safe 不変条件 | TC-LIVE-09 / TC-LIVE-10 / TC-LIVE-12 |
| internal token authz | TC-LIVE-01〜06 |
| `crons = ["*/15 * * * *"]` | Phase 9 / 10 で staging dry-run、契約として `wrangler.toml` の grep 確認を Phase 7 CI に組み込む |

### 6. 期待値の決定論性

- `runCorrelation` のテストは `now: () => new Date(<fixed unix ms>)` を必ず注入し、`occurred_at` / `created_at` を決定論化。
- `crypto.subtle.digest` は Node 20+ / vitest で利用可能。fixture salt は `'test-salt-fixed-32chars-for-vitest__'` 等の決定論値（実 secret は使わない）。

## 変更対象ファイル

| パス | 種別 | 役割 |
| --- | --- | --- |
| `apps/api/src/routes/audit-correlation/__tests__/run-route.test.ts` | 新規 | TC-LIVE-01〜06 |
| `apps/api/src/audit-correlation/__tests__/persist.test.ts` | 新規 | TC-LIVE-07〜10 |
| `apps/api/src/audit-correlation/__tests__/notify-slack.test.ts` | 新規 | TC-LIVE-11〜14 |
| `apps/api/src/audit-correlation/__tests__/run-correlation.test.ts` | 新規 | TC-LIVE-18〜20 |
| `apps/api/src/audit-correlation/__tests__/runbook-url.test.ts` | 新規 | TC-LIVE-15〜17 |
| `scripts/audit-correlation/__tests__/live-mode.bats` | 新規 | TC-LIVE-21〜22 |

## 関数・型シグネチャ案（テスト側）

```ts
// run-route.test.ts のスケルトン
import { describe, it, expect, vi } from 'vitest';
import { auditCorrelationRouter } from '../index';

describe('POST /internal/audit-correlation/run', () => {
  const expectedToken = 'test-token-32chars-padded__________';
  const env = {
    AUDIT_CORRELATION_INTERNAL_TOKEN: expectedToken,
    /* ... 他 env */
  };

  it('TC-LIVE-01: returns 401 when Authorization header is missing', async () => {
    const res = await auditCorrelationRouter.request('/run', { method: 'POST' }, env);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'unauthorized' });
  });

  it('TC-LIVE-05: 401 body must not leak token prefix or length', async () => {
    const res = await auditCorrelationRouter.request('/run', {
      method: 'POST',
      headers: { authorization: 'Bearer wrong' },
    }, env);
    const body = await res.text();
    expect(body).not.toContain(expectedToken);
    expect(body).not.toContain(expectedToken.slice(0, 4));
  });
});
```

## 入出力・副作用

- すべてのテストは in-process（実 GitHub / 実 Slack / 実 D1 を呼ばない）。
- bats live-mode は `--dry-run` で実通信なし、stdout 出力のみ検査。
- 実環境 secret はテストに渡さない（zod schema が許容する最小ダミー値のみ）。

## テスト方針（このセクション本体）

上記 22 ケースで Phase 3 契約をすべてカバー。Phase 5 実装は本 Phase の red テストを green にする方向で進める。

## ローカル実行・検証コマンド

```bash
# vitest（focused）
mise exec -- pnpm --filter @ubm/api test src/routes/audit-correlation
mise exec -- pnpm --filter @ubm/api test src/audit-correlation

# bats live-mode
mise exec -- bash scripts/audit-correlation/__tests__/live-mode.bats

# typecheck / lint（テストファイル含む）
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# grep gate（手動 dry-run。Phase 7 で CI 化）
grep -REn '\b([0-9]{1,3}\.){3}[0-9]{1,3}\b' apps/api/src/audit-correlation || echo "ok: no full IPv4"
grep -REn '(ghp_|github_pat_)[A-Za-z0-9_]{20,}' apps/api/src/audit-correlation || echo "ok: no PAT literal"
```

## 統合テスト連携

- Phase 5 実装は本 Phase 22 ケースを green 化することを完了条件とする。
- Phase 7 CI gate（`audit-correlation-verify.yml`）に本 Phase の vitest / bats / grep gate をジョブとして組み込む。
- Phase 10 staging dry-run で本 Phase 設計の bats live-mode を実環境で 1 回実施し、stdout に禁止パターンが出ないことを evidence 化。
- Phase 11 で `outputs/phase-11/test.log` / `grep-gate.log` に実行ログを保存。

## 参照資料

- Phase 3 outputs（型 / SQL DDL / Slack payload / authz 仕様）
- 親 Phase 4: `docs/30-workflows/completed-tasks/issue-516-github-audit-log-cross-source-correlation/phase-04.md`
- vitest docs / Hono `app.request` テスト docs / `@miniflare/d1` テスト基盤
- bats docs / shellcheck
- CLAUDE.md「シークレット管理」「`apps/api` env アクセス不変条件」

## 成果物

- `outputs/phase-4/phase-4.md`
  - 追加テストファイル 6 本の配置先と framework
  - TC-LIVE-01〜22 のケース定義
  - mock / fixture 戦略
  - grep gate 禁止パターン 7 種
  - 重要不変条件 → テスト ID 対応表
  - 決定論化方針（fixed `now` / fixed salt）

## 完了条件（DoD）

- [ ] テストファイル 6 本（route / persist / notify-slack / run-correlation / runbook-url / live-mode.bats）の配置先と framework が確定。
- [ ] TC-LIVE-01〜22 がすべて Phase 3 契約と整合し、各ケースの入力 / 期待値 / 対応 ID が表で明示されている。
- [ ] mock / fixture 戦略（in-process / `@miniflare/d1` / `fetchImpl` 注入 / fixed `now`）が記述されている。
- [ ] grep gate 禁止パターン 7 種（完全 IPv4 / `User-Agent:` / `ghp_` / `github_pat_` / `xoxb-` / `hooks.slack.com` / `AUDIT_CORRELATION_SALT=` / 64 hex hash）が確定している。
- [ ] 重要不変条件（`apps/web` D1 禁止 / `getEnv()` 経由のみ / `scripts/cf.sh` 経由 / 平文 secret 不記載 / redact-safe / token authz / cron 設定）が test ID にマッピングされている。
- [ ] 実環境 secret / 実 webhook / 実 GitHub をテストで呼ばない方針が明記されている。
- [ ] Phase 5 実装の green 完了基準が「本 Phase の 22 ケース全 pass」と固定されている。

# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | sheets-to-d1-sync-implementation |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| 作成日 | 2026-04-30 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | pending |

## 目的

Phase 4 で確定した TDD 順序（audit → mapping → upsert → mutex → sheets-client → manual → scheduled → backfill → index）に沿って、`apps/api/src/sync/` 9 ファイルの実装手順を runbook + 擬似コード + 単体テスト + sanity check で記述する。各ファイルは「テスト先 → 実装」を厳守し、`sync_audit` writer の `startRun/finishRun/failRun` が**全 sync 経路から `try/finally` で必ず呼ばれる**ことを step ごとに検証する。

## 実行タスク

1. 事前確認（U-05 D1 migration 適用済み / 04 secrets 配置済み）
2. step 1 audit.ts（writer + mutex 判定）
3. step 2 mapping.ts（pure function）
4. step 3 upsert.ts（member_responses / member_identities / member_status）
5. step 4 mutex.ts（DB 排他取得 / 解放）
6. step 5 sheets-client.ts（Service Account JWT + fetch + backoff）
7. step 6 manual.ts（Hono route）
8. step 7 scheduled.ts（Workers scheduled handler）
9. step 8 backfill.ts（D1 batch truncate-and-reload）
10. step 9 index.ts（router mount + scheduled export + wrangler.toml triggers 追記）
11. sanity check（package script 経由の local dev 起動 → 各 endpoint curl）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/sync-module-design.md | 9 ファイル構成 |
| 必須 | outputs/phase-02/audit-writer-design.md | startRun/finishRun/failRun 契約 |
| 必須 | outputs/phase-02/cron-config.md | wrangler.toml 設定 |
| 必須 | outputs/phase-02/d1-contract-trace.md | mapping ↔ data-contract 1:1 |
| 必須 | outputs/phase-04/test-matrix.md | test ID |
| 必須 | `docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/data-contract.md` | golden |
| 必須 | `docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/outputs/phase-02/sync-flow.md` | flow |
| 参考 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | Workers / D1 binding |

## 実行手順

### ステップ 0: 事前確認

| # | 手順 | 期待 |
| --- | --- | --- |
| P-01 | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env staging` | `sync_audit` / `member_responses` / `member_identities` / `member_status` / `form_field_aliases` 適用済み |
| P-02 | `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env staging --command "SELECT name FROM sqlite_master WHERE type='table'"` | 上記 5 テーブル存在 |
| P-03 | wrangler vars / secrets 確認 | `GOOGLE_SERVICE_ACCOUNT_JSON` / `SHEETS_SPREADSHEET_ID` / `SYNC_RANGE` / `SYNC_MAX_RETRIES` 設定済み |

### ステップ 1: `apps/api/src/sync/audit.ts`（TDD 先行）

```ts
// apps/api/src/sync/audit.ts (placeholder)
import type { D1Database } from "@cloudflare/workers-types"
import type { AuditDeps, SyncTrigger, DiffSummary, StartRunResult } from "./types"

export async function startRun(deps: AuditDeps, trigger: SyncTrigger): Promise<StartRunResult> {
  const running = await deps.db
    .prepare("SELECT COUNT(*) as c FROM sync_audit WHERE status = 'running'")
    .first<{ c: number }>()
  if ((running?.c ?? 0) > 0) return { auditId: "", acquired: false }
  const auditId = deps.newId()
  await deps.db
    .prepare("INSERT INTO sync_audit (audit_id, trigger, started_at, status) VALUES (?, ?, ?, 'running')")
    .bind(auditId, trigger, deps.now()).run()
  return { auditId, acquired: true }
}

export async function finishRun(deps: AuditDeps, auditId: string, summary: DiffSummary): Promise<void> {
  await deps.db
    .prepare("UPDATE sync_audit SET status='success', finished_at=?, inserted=?, updated=?, skipped=?, diff_summary_json=? WHERE audit_id=? AND status='running'")
    .bind(deps.now(), summary.inserted, summary.updated, summary.skipped, JSON.stringify(summary), auditId).run()
}

export async function failRun(deps: AuditDeps, auditId: string, reason: string): Promise<void> {
  if (!auditId) return // mutex 取得失敗時は no-op
  await deps.db
    .prepare("UPDATE sync_audit SET status='failed', finished_at=?, failed_reason=? WHERE audit_id=? AND status='running'")
    .bind(deps.now(), reason, auditId).run()
}
```

完了条件: U-A-01〜U-A-08 全件 pass。

### ステップ 2: `apps/api/src/sync/mapping.ts`

```ts
// apps/api/src/sync/mapping.ts (placeholder)
import type { FormFieldAlias, NormalizedRow, SheetRow } from "./types"

export function parseTimestamp(s: string): string { /* ISO8601 化 */ }
export function normalizeEmail(s: string): string { return s.trim().toLowerCase() }

export function mapConsent(raw: string): "consented" | "declined" | "unknown" {
  const v = raw?.trim() ?? ""
  if (v === "同意する") return "consented"
  if (v === "同意しない") return "declined"
  return "unknown"
}

export function mapRow(row: SheetRow, aliases: FormFieldAlias[]): NormalizedRow {
  // 1. system field: timestamp / responseEmail / responseId
  // 2. aliases から questionId → stableKey 解決
  // 3. 未知 questionId は extra_fields_json + unmapped_question_ids_json
  // 4. consent 2 件は member_status へ転写
}
```

完了条件: U-M-01〜U-M-12 + C-D-01〜C-D-31 pass。

### ステップ 3: `apps/api/src/sync/upsert.ts`

```ts
// apps/api/src/sync/upsert.ts (placeholder)
export async function upsertResponses(db: D1Database, rows: NormalizedRow[]): Promise<DiffSummary> {
  const stmts = rows.flatMap(r => [
    db.prepare("INSERT INTO member_responses (response_id, response_email, submitted_at, answers_json, extra_fields_json, unmapped_question_ids_json) VALUES (?,?,?,?,?,?) ON CONFLICT(response_id) DO UPDATE SET ...")
      .bind(r.responseId, r.responseEmail, r.submittedAt, JSON.stringify(r.answers), JSON.stringify(r.extras), JSON.stringify(r.unmapped)),
    db.prepare("INSERT INTO member_identities (response_email, response_id) VALUES (?,?) ON CONFLICT(response_email) DO UPDATE SET response_id=excluded.response_id")
      .bind(r.responseEmail, r.responseId),
    db.prepare("INSERT INTO member_status (response_email, public_consent, rules_consent) VALUES (?,?,?) ON CONFLICT(response_email) DO UPDATE SET public_consent=excluded.public_consent, rules_consent=excluded.rules_consent")
      .bind(r.responseEmail, r.publicConsent, r.rulesConsent),
  ])
  await db.batch(stmts)
  return { inserted: 0, updated: 0, skipped: 0 } // 実数集計は RETURNING / 事前 SELECT
}
```

注意: `member_status.publish_state` / `is_deleted` / `meeting_sessions` は upsert 対象外（不変条件 #4）。`SET ... = excluded.*` 列を限定する。

完了条件: upsert 6 件 unit pass。

### ステップ 4: `apps/api/src/sync/mutex.ts`

`audit.ts.startRun` の `acquired` を mutex 結果として扱う。`mutex.ts` は薄い wrapper:

```ts
// apps/api/src/sync/mutex.ts (placeholder)
export async function withSyncMutex<T>(
  deps: AuditDeps,
  trigger: SyncTrigger,
  body: (auditId: string) => Promise<DiffSummary>,
): Promise<{ status: "acquired"; auditId: string; summary: DiffSummary } | { status: "conflict" }> {
  const { auditId, acquired } = await startRun(deps, trigger)
  if (!acquired) return { status: "conflict" }
  try {
    const summary = await body(auditId)
    await finishRun(deps, auditId, summary)
    return { status: "acquired", auditId, summary }
  } catch (e) {
    await failRun(deps, auditId, (e as Error).message ?? "unknown_error")
    throw e
  }
}
```

完了条件: I-06 / U-A-08 pass（TECH-M-01 / TECH-M-03）。

### ステップ 5: `apps/api/src/sync/sheets-client.ts`

```ts
// apps/api/src/sync/sheets-client.ts (placeholder)
// Workers 互換: googleapis を使わず fetch + crypto.subtle で RS256 JWT を生成
async function signServiceAccountJwt(saJson: string): Promise<string> {
  // header / payload (iss/scope/aud/exp/iat) を base64url
  // crypto.subtle.importKey("pkcs8", ...) で private_key を読み込み
  // crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, data)
}

async function exchangeJwtForAccessToken(jwt: string): Promise<string> {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  })
  return (await r.json()).access_token
}

export async function fetchSheetRows(env: Env, opts: { since?: string }): Promise<SheetRow[]> {
  const token = await exchangeJwtForAccessToken(await signServiceAccountJwt(env.GOOGLE_SERVICE_ACCOUNT_JSON))
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${env.SHEETS_SPREADSHEET_ID}/values/A:Z`
  return await withBackoff(async () => {
    const r = await fetch(url, { headers: { authorization: `Bearer ${token}` } })
    if (r.status === 429 || r.status >= 500) throw new RateLimitError(r.status)
    return parseValues(await r.json(), opts.since)
  })
}

async function withBackoff<T>(fn: () => Promise<T>): Promise<T> {
  const delays = [500, 2000, 8000]
  for (let i = 0; i <= delays.length; i++) {
    try { return await fn() } catch (e) {
      if (i === delays.length) throw e
      await new Promise(r => setTimeout(r, delays[i]))
    }
  }
  throw new Error("unreachable")
}
```

完了条件: U sheets-client 5 件 + I-08 / I-09 pass。

### ステップ 6: `apps/api/src/sync/manual.ts`

```ts
// apps/api/src/sync/manual.ts (placeholder)
import { Hono } from "hono"
import { withSyncMutex } from "./mutex"
import { fetchSheetRows } from "./sheets-client"
import { mapRow } from "./mapping"
import { upsertResponses } from "./upsert"
import { requireSyncAdmin } from "../middleware/require-sync-admin"

export const manualSync = new Hono<{ Bindings: Env }>()

manualSync.post("/admin/sync/run", requireSyncAdmin, async (c) => {
  const deps = { db: c.env.DB, now: () => new Date().toISOString(), newId: () => crypto.randomUUID() }
  const result = await withSyncMutex(deps, "manual", async (auditId) => {
    const rows = await fetchSheetRows(c.env, {})
    const aliases = await loadAliases(c.env.DB)
    const normalized = rows.map(r => mapRow(r, aliases))
    return await upsertResponses(c.env.DB, normalized)
  })
  if (result.status === "conflict") return c.json({ error: "sync_in_progress" }, 409)
  return c.json({ auditId: result.auditId, ...result.summary })
})
```

完了条件: I-01 / I-02 / C-F-01 pass。

### ステップ 7: `apps/api/src/sync/scheduled.ts`

```ts
// apps/api/src/sync/scheduled.ts (placeholder)
export async function runScheduledSync(env: Env): Promise<void> {
  const deps = { db: env.DB, now: () => new Date().toISOString(), newId: () => crypto.randomUUID() }
  const lastSuccess = await env.DB
    .prepare("SELECT MAX(finished_at) AS t FROM sync_audit WHERE status='success' AND trigger IN ('manual','scheduled')")
    .first<{ t: string | null }>()
  await withSyncMutex(deps, "scheduled", async () => {
    // delta: submittedAt >= lastSuccess.t（同秒取りこぼし防止: TECH-M-02）
    const rows = await fetchSheetRows(env, { since: lastSuccess?.t ?? undefined })
    const aliases = await loadAliases(env.DB)
    return await upsertResponses(env.DB, rows.map(r => mapRow(r, aliases)))
  })
}
```

完了条件: I-03 / I-07 / C-F-02 pass。

### ステップ 8: `apps/api/src/sync/backfill.ts`

```ts
// apps/api/src/sync/backfill.ts (placeholder)
backfillSync.post("/admin/sync/backfill", requireSyncAdmin, async (c) => {
  const deps = { db: c.env.DB, now: () => new Date().toISOString(), newId: () => crypto.randomUUID() }
  const result = await withSyncMutex(deps, "backfill", async () => {
    const rows = await fetchSheetRows(c.env, {})
    const aliases = await loadAliases(c.env.DB)
    const normalized = rows.map(r => mapRow(r, aliases))
    // 1. truncate member_responses（response_id PK のため全削除）
    // 2. truncate member_identities
    // 3. member_status は public_consent / rules_consent 列のみ UPDATE（admin 列は不変）
    // 4. 全 normalized を D1 batch で再 INSERT
    const stmts = [
      c.env.DB.prepare("DELETE FROM member_responses"),
      c.env.DB.prepare("DELETE FROM member_identities"),
      ...buildBackfillInserts(c.env.DB, normalized), // member_status は upsert で consent 列のみ
    ]
    await c.env.DB.batch(stmts)
    return { inserted: normalized.length, updated: 0, skipped: 0 }
  })
  if (result.status === "conflict") return c.json({ error: "sync_in_progress" }, 409)
  return c.json({ auditId: result.auditId, ...result.summary })
})
```

完了条件: I-04 / C-F-03 / S-05 pass（admin 列 touch 0 件）。

### ステップ 9: `apps/api/src/sync/index.ts` + wrangler.toml

```ts
// apps/api/src/sync/index.ts (placeholder)
export { manualSync } from "./manual"
export { backfillSync } from "./backfill"
export { auditQuery } from "./audit-query" // GET /admin/sync/audit?limit=N
export { runScheduledSync } from "./scheduled"
```

```ts
// apps/api/src/index.ts (placeholder)
import { manualSync, backfillSync, auditQuery, runScheduledSync } from "./sync"
const app = new Hono<{ Bindings: Env }>()
app.route("/", manualSync)
app.route("/", backfillSync)
app.route("/", auditQuery)
export default {
  fetch: app.fetch,
  scheduled: async (event: ScheduledEvent, env: Env, ctx: ExecutionContext) => {
    ctx.waitUntil(runScheduledSync(env))
  },
}
```

```toml
# apps/api/wrangler.toml（追記）
[triggers]
crons = ["0 * * * *"]
```

### ステップ 10: sanity check（NON_VISUAL evidence）

| # | 手順 | 期待 |
| --- | --- | --- |
| S-01 | `mise exec -- pnpm --filter @ubm/api dev` | port listen、`scheduled` handler 登録ログ |
| S-02 | `curl -X POST http://127.0.0.1:8787/admin/sync/run -H "x-admin-token: ..."` | 200 + `{auditId, inserted, updated, skipped}` |
| S-03 | `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env staging --command "SELECT * FROM sync_audit ORDER BY started_at DESC LIMIT 3"` | trigger=manual / status=success |
| S-04 | `mise exec -- pnpm --filter @ubm/api dev:test-scheduled` で `curl "http://127.0.0.1:8787/__scheduled?cron=0+*+*+*+*"` | scheduled 起動 → audit row 追加 |
| S-05 | 連続 manual `POST /admin/sync/run` 2 回 | 2 回目は 409 + error="sync_in_progress" |
| S-06 | `curl -X POST .../admin/sync/backfill` 後に `SELECT publish_state, is_deleted FROM member_status` | backfill 前後で値不変 |
| S-07 | `grep -rE "publish_state\|is_deleted\|meeting_sessions" apps/api/src/sync/` | manual / scheduled / backfill ファイルで 0 件 |
| S-08 | `grep -r "googleapis\|node:" apps/api/src/sync/` | 0 件 |

evidence は JSON / SQL 結果 / local dev ログを `outputs/phase-05/sanity-evidence/` に保存（実行は Phase 11）。

## 統合テスト連携【必須】

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | rate limit / mutex 衝突 / consent 異常 / D1 transaction 失敗を異常系として再演 |
| Phase 7 | runbook step ↔ AC × test ID |
| Phase 11 | sanity check S-01〜S-08 を本番手順として実行 |

| 判定項目 | 基準 | 結果 |
| --- | --- | --- |
| ユニットテストLine | 80%+ | TBD |
| 結合テストAPI | 100% | TBD |
| 結合テストシナリオ正常系 | 100% | TBD |
| 結合テストシナリオ異常系 | 80%+ | TBD |

## 多角的チェック観点

- 不変条件 #1: mapping.ts は `form_field_aliases` 経由のみ、stableKey 直書き禁止
- 不変条件 #2: mapConsent が `consented` / `declined` / `unknown` のみ返す
- 不変条件 #3: normalizeEmail で system field 化
- 不変条件 #4: backfill / upsert で `publish_state` / `is_deleted` / `meeting_sessions` 列を SET 句に含めない（S-07）
- 不変条件 #5: sync コードは `apps/api/src/sync/` のみ、apps/web から import 禁止
- 不変条件 #6: googleapis / node: 禁止（S-08）
- 不変条件 #7: backfill が Sheets を真として全件再書込
- DI: `AuditDeps` / `Env` を引数注入し、unit test で in-memory D1 を差し替え可能
- secret 取扱: `GOOGLE_SERVICE_ACCOUNT_JSON` は `c.env` 経由のみ、ログに出力しない

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 事前確認（D1 / secrets） | 5 | pending | P-01〜P-03 |
| 2 | audit.ts 実装 | 5 | pending | TDD 1 |
| 3 | mapping.ts 実装 | 5 | pending | TDD 2 |
| 4 | upsert.ts 実装 | 5 | pending | TDD 3 |
| 5 | mutex.ts 実装 | 5 | pending | TDD 4 |
| 6 | sheets-client.ts 実装 | 5 | pending | TDD 5 |
| 7 | manual.ts 実装 | 5 | pending | TDD 6 |
| 8 | scheduled.ts 実装 | 5 | pending | TDD 7 |
| 9 | backfill.ts 実装 | 5 | pending | TDD 8 |
| 10 | index.ts + wrangler.toml triggers | 5 | pending | TDD 9 |
| 11 | sanity check S-01〜S-08 | 5 | pending | local dev |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | サマリ |
| ドキュメント | outputs/phase-05/runbook.md | 9 ファイル placeholder + sanity |
| メタ | artifacts.json | phase 5 status |

## 完了条件

- [ ] 9 ファイルの placeholder と単体テスト ID が runbook に記載
- [ ] audit writer が全 sync 経路から `try/finally` で呼ばれる構造（withSyncMutex）
- [ ] wrangler.toml `[triggers] crons` 追記の手順
- [ ] sanity check S-01〜S-08
- [ ] secret 値は含まない（参照のみ）
- [ ] **本Phase内の全タスクを100%実行完了**

## タスク100%実行確認【必須】

- 全 11 サブタスクが completed
- 2 種ドキュメント配置
- 不変条件 #1〜#7 と対応 step が明記
- 次 Phase へ failure case を引継ぎ
- artifacts.json の phase 5 を completed に更新

## 次 Phase

- 次: 6 (異常系検証)
- 引き継ぎ事項:
  - rate limit / mutex 衝突 / consent 不整合 / D1 batch 失敗 / Sheets schema diff の異常系定義
  - sanity check S-05 / S-06 を異常系再演で深堀り
- ブロック条件: runbook が placeholder で埋まっていない / TDD 順序未順守の場合は進まない

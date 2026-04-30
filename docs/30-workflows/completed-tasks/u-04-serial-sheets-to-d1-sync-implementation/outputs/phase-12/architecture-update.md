# u-04 Architecture Update — apps/api 構成と sync モジュール責務

## apps/api ディレクトリ構成（u-04 反映後）

```
apps/api/src/
├── index.ts                       # Hono app + scheduled handler 入口
├── middleware/
│   ├── require-admin.ts           # 既存：人間向け管理 UI（cookie/session）
│   └── require-sync-admin.ts      # 【新規】sync 系専用 Bearer 認証
├── sync/                          # 【新規】Sheets → D1 sync layer
│   ├── index.ts                   # route barrel export
│   ├── types.ts                   # SyncTrigger / AuditRow / DiffSummary
│   ├── manual.ts                  # POST /admin/sync/run（正本）
│   ├── scheduled.ts               # Cron Trigger handler 本体
│   ├── backfill.ts                # POST /admin/sync/backfill
│   ├── audit.ts                   # sync_job_logs writer + withSyncMutex
│   ├── audit-route.ts             # GET /admin/sync/audit
│   ├── mutex.ts                   # sync_locks acquire/release
│   ├── sheets-client.ts           # Workers 互換 Sheets API v4 client
│   ├── mapping.ts                 # form_field_aliases 駆動 mapping
│   ├── upsert.ts                  # member_responses/identities/status upsert
│   └── schema/                    # contract schema (data-contract.md trace)
├── jobs/
│   ├── sync-lock.ts               # acquireSyncLock / expiry 判定
│   ├── sync-sheets-to-d1.ts       # 旧実装（resolveServiceAccountJson は流用）
│   └── mappers/
│       ├── extract-consent.ts
│       ├── normalize-response.ts
│       └── sheets-to-members.ts
├── routes/
│   └── admin/
│       └── sync.ts                # 旧 POST /admin/sync の互換 mount（runManualSync へ delegate）
└── repository/                    # 既存 D1 アクセス層
```

## sync モジュール責務マトリクス

| モジュール | Inbound | Outbound | D1 テーブル |
| --- | --- | --- | --- |
| `manual.ts` | HTTP `POST /admin/sync/run` (Bearer) | `withSyncMutex` → fetch/map/upsert | sync_job_logs (writer), sync_locks (writer) |
| `scheduled.ts` | Workers `scheduled()` event | `withSyncMutex` → fetch/map/upsert（差分） | sync_job_logs (writer), sync_locks (writer) |
| `backfill.ts` | HTTP `POST /admin/sync/backfill` (Bearer) | `withSyncMutex` → 全件 fetch → upsert | sync_job_logs, sync_locks, member_responses など |
| `audit.ts` | sync ハンドラ群 | D1 prepare/run | sync_job_logs (writer), sync_locks (mutex) |
| `audit-route.ts` | HTTP `GET /admin/sync/audit?limit=N` (Bearer) | D1 SELECT | sync_job_logs (reader) |
| `sheets-client.ts` | sync ハンドラ群 | Google Sheets API v4 (HTTPS) | （無し） |
| `mapping.ts` | sheets-client | upsert | form_field_aliases (reader) |
| `upsert.ts` | mapping | D1 batch | member_responses, member_identities, member_status (admin 列除く) |
| `mutex.ts` | audit.ts | D1 prepare/run | sync_locks |

## Cron Trigger 配備（wrangler.toml）

```toml
# apps/api/wrangler.toml
[triggers]
crons = ["0 * * * *"]   # 毎時 0 分
```

`scheduled` handler は `apps/api/src/index.ts` の `export default { fetch, scheduled }` から `runScheduledSync` を呼び出す。

## 認証境界

| 経路 | middleware | secret |
| --- | --- | --- |
| `POST /admin/sync/run` | `requireSyncAdmin` | `SYNC_ADMIN_TOKEN` |
| `POST /admin/sync/backfill` | `requireSyncAdmin` | `SYNC_ADMIN_TOKEN` |
| `GET /admin/sync/audit` | `requireSyncAdmin` | `SYNC_ADMIN_TOKEN` |
| `scheduled` (Workers) | （Cron Trigger は外部から到達不能） | （無し） |
| 旧 `POST /admin/sync`（互換 mount） | `requireSyncAdmin` | `SYNC_ADMIN_TOKEN` |

人間向け `requireAdmin`（cookie / session）とは分離する。`requireSyncAdmin` は token Bearer のみを受理。

## 不変条件と境界

- 不変条件 #5: apps/web → D1 直接アクセス禁止。sync は完全に apps/api 内で完結。
- 不変条件 #4: backfill / upsert は `member_status` の admin 列（publish_state, is_deleted, meeting_sessions）に touch しない。
- 不変条件 #6: Workers 互換の fetch + crypto.subtle のみ。`googleapis` / `google-auth-library` は package.json に不在。

## 03 contract / UT-01 design への trace

| 設計 doc | 実装 mapping |
| --- | --- |
| `03/.../phase-02/data-contract.md` | `sync/mapping.ts` + `sync/upsert.ts`（差分ゼロ） |
| `03/.../phase-02/sync-flow.md` | `sync/manual.ts` / `scheduled.ts` / `backfill.ts` の flow |
| `ut-01/.../phase-02/sync-log-schema.md` | `sync_job_logs`（physical 名）/ `sync_locks` を audit ledger として採用（u-04 Phase 2 で確定） |

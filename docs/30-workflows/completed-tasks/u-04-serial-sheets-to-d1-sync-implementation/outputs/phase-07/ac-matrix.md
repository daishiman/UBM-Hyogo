# u-04 AC マトリクス

| AC | 期待動作 | 実装位置 | テスト ID |
|----|----------|----------|-----------|
| AC-1 | `POST /admin/sync/run` が manual sync を実行する | `apps/api/src/sync/manual.ts` | I-01 / I-02 / I-03 |
| AC-2 | `POST /admin/sync/backfill` が truncate-and-reload する | `apps/api/src/sync/backfill.ts` | I-07 |
| AC-3 | scheduled handler (Workers cron) が hourly に走る | `apps/api/src/index.ts scheduled` + `apps/api/src/sync/scheduled.ts` + `wrangler.toml [triggers]` | I-04 / I-05 / I-06 |
| AC-4 | `sync_job_logs` に running → success/failed/skipped が記録される | `apps/api/src/sync/audit.ts` | U-A-01 / U-A-02 / U-A-03 / U-X-01 / U-X-02 |
| AC-5 | `sync_locks` で二重実行を抑止する | `apps/api/src/sync/audit.ts withSyncMutex` + `apps/api/src/jobs/sync-lock.ts` | U-X-03 / U-A-02 |
| AC-6 | mapping は 31 stableKey 契約に従う | `apps/api/src/sync/mapping.ts` (re-export) → `apps/api/src/jobs/mappers/sheets-to-members.ts` | 既存 mapping テストを継承 |
| AC-7 | `GET /admin/sync/audit?limit=N` で監査履歴を取得できる | `apps/api/src/sync/audit-route.ts` | I-08 / I-09 / 認証 |
| AC-8 | SYNC_ADMIN_TOKEN Bearer 認証必須 (manual / backfill / audit) | `apps/api/src/middleware/require-sync-admin.ts` | I-02 / I-03 / 401 認証 |
| AC-9 | error_reason は email 等 PII を redact する | `apps/api/src/sync/audit.ts redact` | U-X-02 |
| AC-10 | 不変条件 #4 (admin 列保護) を維持する | `apps/api/src/sync/upsert.ts` / `backfill.ts` | I-07 |
| AC-11 | sheet→D1 (`fetchAll` / `fetchDelta`) は googleapis SDK を使わない | `apps/api/src/sync/sheets-client.ts` (Google Auth + fetch + crypto.subtle) | U-S-01..05 + grep gate |
| AC-12 | 429/5xx 時 exponential backoff (500ms→2s→8s, max 3) | `apps/api/src/sync/sheets-client.ts fetchWithBackoff` | U-S-02 / U-S-03 / U-S-05 |

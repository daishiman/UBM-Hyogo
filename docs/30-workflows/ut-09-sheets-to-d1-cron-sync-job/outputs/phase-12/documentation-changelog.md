# Phase 12 — ドキュメント更新履歴

| 日付 | ファイル | 概要 |
| --- | --- | --- |
| 2026-04-27 | `apps/api/wrangler.toml` | cron triggers (prod 6h / staging 1h) と sync 用 vars を追加 |
| 2026-04-27 | `apps/api/migrations/0002_sync_logs_locks.sql` | sync_locks / sync_job_logs DDL を追加 |
| 2026-04-27 | `apps/api/src/index.ts` | scheduled() を export、`/admin` route 登録 |
| 2026-04-27 | `apps/api/src/jobs/*` | sync core / sheets-fetcher / mapper / lock を新設 |
| 2026-04-27 | `apps/api/src/routes/admin/sync.ts` | Bearer 認証付き同期 endpoint を新設 |
| 2026-04-27 | `apps/api/src/utils/with-retry.ts`, `apps/api/src/utils/write-queue.ts` | 再試行・直列化 util を新設 |
| 2026-04-27 | `apps/api/src/**/*.test.ts` | unit / integration / authorization 計 22 ケースを追加 |
| 2026-04-27 | `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/outputs/phase-{01..12}` | 仕様書テンプレを実装サマリで上書き |
| 2026-04-27 | `docs/30-workflows/unassigned-task/task-ut09-direction-reconciliation-001.md` | legacy umbrella と旧 UT-09 Sheets 実装の方針衝突を PR blocker として formalize |

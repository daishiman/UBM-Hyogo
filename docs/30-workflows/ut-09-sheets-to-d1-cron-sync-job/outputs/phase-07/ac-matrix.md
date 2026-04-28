# Phase 7 成果物 — AC マトリクス

## AC × 検証 × 実装 トレーサビリティ

| AC | 内容 | 実装 | 検証 | ステータス |
| --- | --- | --- | --- | --- |
| AC-1 | Cron Trigger による定期実行 | `wrangler.toml [triggers]`、`apps/api/src/index.ts` の `scheduled()` | local path documented / staging smoke is UT-26 | 実装完 / staging 実機 pending |
| AC-2 | Sheets→D1 マッピング正確 | `apps/api/src/jobs/mappers/sheets-to-members.ts` | `mapSheetRows` 5 ケース | PASS |
| AC-3 | 冪等性 (`ON CONFLICT DO UPDATE`) | `upsertMembers` (sync-sheets-to-d1.ts) | `runSync > 冪等性` | PASS |
| AC-4 | 1000 行超対応 | `chunk()` + `buildA1Ranges()` + `SYNC_RANGE` | `chunk` unit | PASS |
| AC-5 | `/admin/sync` 認証 | `apps/api/src/routes/admin/sync.ts` | `adminSyncRoute` 4 ケース | PASS |
| AC-6 | 同期ログ記録 | `sync_job_logs` insert/update | `runSync` integration | PASS |
| AC-7 | retry/backoff/queue/batch | `with-retry.ts` / `write-queue.ts` / `db.batch(<=100)` | unit + integration | PASS |
| AC-8 | staging load test 破綻なし | TTL lock + queue 直列化 + retry | UT-26 staging-deploy-smoke 連携 | delegated |
| AC-9 | SA JSON は Cloudflare Secret 経由 | `wrangler.toml` `[vars]` に SA は書かない、Secret 経由のみ | secret 名と非ハードコードを確認。実登録は環境依存 | 実装完 / registration pending |
| AC-10 | staging/main 別 Cron schedule | `[triggers]` (prod 6h) / `[env.staging.triggers]` (1h) | wrangler.toml レビュー | PASS |
| AC-11 | 4 条件 PASS | Phase 1/3 で確認 | Phase 10 go-no-go | PASS |

## カバレッジ

vitest 22 件すべて green。`@ubm-hyogo/api` typecheck も成功。staging 実機 smoke と load/contention は Secret / Cloudflare 環境が必要なため UT-26 へ委譲。

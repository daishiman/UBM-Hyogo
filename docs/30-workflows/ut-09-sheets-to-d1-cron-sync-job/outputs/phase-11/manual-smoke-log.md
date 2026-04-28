# Phase 11 成果物 — 手動 smoke test ログ

> 本フェーズは UI/UX 実装ではないため、視覚的検証 (スクリーンショット) は対象外。
> wrangler dev / Cloudflare staging 上の動作ログで AC-1 / AC-5 / AC-6 を確認する。

## 1. 自動テスト結果 (本リポジトリ内で実行可能)

```
$ mise exec -- pnpm vitest run apps/api/src
 ✓ apps/api/src/jobs/mappers/sheets-to-members.test.ts (5 tests) 7ms
 ✓ apps/api/src/utils/with-retry.test.ts (6 tests) 13ms
 ✓ apps/api/src/utils/write-queue.test.ts (2 tests) 23ms
 ✓ apps/api/src/routes/admin/sync.test.ts (4 tests) 29ms
 ✓ apps/api/src/jobs/sync-sheets-to-d1.test.ts (5 tests) 50ms

 Test Files  5 passed (5)
      Tests  22 passed (22)
```

## 2. ローカル smoke 手順 (実行担当: 受け取り側 / Secret 必要のため AI 自動化対象外)

```bash
# 1. Secret 登録 (1Password から取得)
wrangler secret put GOOGLE_SHEETS_SA_JSON --env staging
wrangler secret put SYNC_ADMIN_TOKEN --env staging

# 2. ローカル実行
mise exec -- pnpm --filter @ubm-hyogo/api wrangler dev --test-scheduled --env staging

# 3. cron シミュレーション
curl -X POST 'http://127.0.0.1:8787/__scheduled?cron=0+*+*+*+*'

# 4. /admin/sync で手動同期
curl -X POST 'http://127.0.0.1:8787/admin/sync' \
  -H "Authorization: Bearer ${SYNC_ADMIN_TOKEN}"

# 5. 同期ログ確認
mise exec -- pnpm --filter @ubm-hyogo/api wrangler d1 execute ubm-hyogo-db-staging --env staging --local \
  --command "SELECT run_id, trigger_type, status, fetched_count, upserted_count, retry_count, started_at, finished_at FROM sync_job_logs ORDER BY started_at DESC LIMIT 5"
```

## 3. 期待される観測結果

| 観点 | 期待 |
| --- | --- |
| `/__scheduled` POST | `sync_job_logs` に `trigger_type=cron, status=running→success` の行が追加 |
| `/admin/sync` POST (正トークン) | HTTP 200 + `{ok: true, result.status: 'success'}` |
| `/admin/sync` POST (誤トークン) | HTTP 401 |
| `member_responses` | Sheets の各行が response_id で 1 行ずつ存在 (冪等) |
| 連続 2 回実行 | members 件数は変動しない (再 sync は upsert) |

## 4. blocker / 注意事項

- 実機 smoke は Secret (SA JSON / SYNC_ADMIN_TOKEN) を必要とするため、本 AI 実行内では完了させない。担当者が staging 環境で実施し、結果を本ファイルに追記する。
- staging deploy 後の load/contention test (AC-8) は UT-26 で実施。

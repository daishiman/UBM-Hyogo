# Phase 6 成果物 — 異常系検証

## 1. 失敗シナリオ一覧

| # | シナリオ | HTTP / 例外 | 振る舞い | 検証 |
| --- | --- | --- | --- | --- |
| 1 | Service Account JWT 不正 | OAuth 401 | `SheetsFetchError(status=401)` を throw、`runSync` は `failed` で終了 | 手動 (Phase 11) |
| 2 | Sheets API 403 (権限不足) | 403 | `SheetsFetchError(status=403)`、retry なし | 手動 |
| 3 | Sheets API 429 (rate limit) | 429 | `SheetsFetchError(status=429)`。withRetry の isRetryable 拡張余地あり (現状 SQLITE_BUSY のみ retry) → `failed` で次回 cron を待つ | 手動 |
| 4 | Sheets API 5xx | 500/503 | 同上 (SHEETS_FETCH_ERROR)、`error_reason` に記録、次回 cron で復帰 | 手動 |
| 5 | D1 SQLITE_BUSY | runtime | withRetry が exponential backoff で再試行。`retry_count` に記録 | unit (`with-retry.test.ts`) |
| 6 | 二重起動 (前回 lock 残存) | runtime | acquireSyncLock が null → `runSync` は `skipped` を返す | integration (`runSync > 二重起動時は skipped`) |
| 7 | submittedAt / email 欠損行 | runtime | mapper が `skipped` 配列に格納し、対象行を upsert しない | unit (`mapSheetRows > 欠損行スキップ`) |
| 8 | 未知の列 | runtime | `extra_fields_json` / `unmapped_question_ids_json` に退避 | unit |
| 9 | consent 不明値 | runtime | `unknown` を格納 | unit |
| 10 | /admin/sync 認証不正 | 401 | route 側で `unauthorized` を返却 | authorization (`adminSyncRoute`) |
| 11 | SYNC_ADMIN_TOKEN 未設定 | 500 | route 側で 500 を返却 | authorization |
| 12 | D1 batch 失敗 (永続) | runtime | error は `errors[]` に蓄積、`status=failed` でログ記録 | integration (`runSync > fetcher が throw`) |

## 2. 既知の制約

- 4xx 系 (401/403/422) は本実装では retry 対象外。次回 cron もしくは手動 sync で再試行する。`withRetry.isRetryable` を拡張する場合は Phase 6 リスクを再評価する。
- 1 run 内で部分失敗があっても他バッチは続行する設計（write-queue が catch して chain 継続）。完全 atomic ではない点を運用文書 (Phase 12) に記載する。

## 3. 失敗時の復旧フロー

1. `wrangler tail --env staging` で `error_reason` を確認
2. Sheets / Secret 設定を修正
3. `/admin/sync` で手動再同期、または次回 cron まで待機
4. 復旧後の `sync_job_logs` に `success` 行が追加されることを確認

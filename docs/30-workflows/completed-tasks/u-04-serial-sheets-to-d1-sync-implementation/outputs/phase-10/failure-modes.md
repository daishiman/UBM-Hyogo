# u-04 failure modes 対応表

| ID | 症状 | 検知 | 一次対応 | 恒久対応 | 不変条件 |
| --- | --- | --- | --- | --- | --- |
| F-01 | Sheets 認証失敗 (401/403) | `sync_job_logs.error_reason` に `auth failed` | 1Password で SA key を rotate → `bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON ...` | 鍵 rotation 手順を 04 task へ | secret hygiene |
| F-02 | Spreadsheet 不正 (404) | error_reason `not found` | `SHEETS_SPREADSHEET_ID` を確認、staging で先に試す | env 別 secret 管理 | - |
| F-03 | Rate limit (429) backoff 超過 | error_reason `rate limit 429` | 次 cron 待ち (backoff 自動) | 周期延長 / paid quota | #6 |
| F-04 | 5xx 連続 | error_reason `rate limit 5xx` | 次 cron 待ち | 監視 alert (09b) | #6 |
| F-05 | mapping 例外 (header 不整合) | error_reason に redact 後 message | Sheets 側 header 確認 | 07b alias 追加 | #1 |
| F-06 | D1 batch 失敗 | error_reason `D1_ERROR ...` | 再実行 (upsert 冪等) | batch サイズ分割検討 | #7 |
| F-07 | Mutex 二重取得 (skipped) | sync_job_logs に status='skipped' + `another sync is in progress` | 通常動作 (1 回目を待つ) | - | AC-5 |
| F-08 | SYNC_ADMIN_TOKEN 未設定 | HTTP 500 / audit row 未作成 | secret 設定 | - | secret hygiene |
| F-09 | SYNC_ADMIN_TOKEN 不一致 | HTTP 401 / audit row 未作成 | Bearer 値確認 | - | AC-8 |
| F-10 | env 必須値欠落 (`GOOGLE_SERVICE_ACCOUNT_JSON` / `SHEETS_SPREADSHEET_ID`) | error_reason `... 未設定` | env / secret 設定 | wrangler.toml validate 強化 | - |
| F-11 | Stale lock (前回 running 残存) | `GET /admin/sync/audit` で running が長時間残存 | TTL 切れで次 startRun が DELETE → 再取得 / 不能なら R-06 で強制解放 | dead lock TTL の自動運用は Phase 12 検討 | - |
| F-12 | scheduled cron 重複起動 | mutex で 2 回目 skip | 通常動作 | - | AC-5 |
| F-13 | scheduled cursor 0 件 (初回) | normal 起動 | - | - | - |
| F-14 | 同秒 submittedAt 2 件 | `>=` cursor + responseId upsert で吸収 | 通常動作 | - | TECH-M-02 |
| F-15 | finishRun update 失敗 | swallow (`.catch(() => undefined)`) | 次回 audit query で確認 | 監視 alert | TECH-M-03 |
| F-16 | releaseSyncLock 失敗 | swallow / TTL 切れで自然解放 | - | - | - |
| F-17 | backfill 中の admin 列触り PR | code review で reject | - | ESLint custom rule 強化 (TODO) | #4 |
| F-18 | apps/web から D1 直アクセス試行 | code review / lint | 即 reject | apps/api endpoint 追加 | #5 |
| F-19 | audit GET の不正 limit | HTTP 400 `invalid_limit` | クエリ修正 | - | - |
| F-20 | manual route HTTP 409 (skipped) | レスポンス body `sync_in_progress` | 1 回目完了待ち | - | AC-5 |

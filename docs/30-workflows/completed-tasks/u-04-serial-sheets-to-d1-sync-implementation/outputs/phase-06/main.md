# Phase 6 異常系検証

u-04 sync layer の障害ケース・分岐テスト整理。すべて Phase 4 test-matrix.md の ID と紐づく。

## failed_reason 列挙 (sync_job_logs.error_reason に redact 後格納)

| code | 発生源 | redact 後の例 |
|------|--------|---------------|
| F-01 | Sheets 認証失敗 (`SheetsFetchError 401/403`) | `auth failed` |
| F-02 | Spreadsheet 不正 (`SheetsFetchError 404`) | `not found` |
| F-03 | Rate limit 超過 (`RateLimitError 429` retry over) | `rate limit 429` |
| F-04 | 5xx 連続 (`RateLimitError 5xx` retry over) | `rate limit 503` |
| F-05 | mapping 中の例外 (header 不整合 等) | mapping detail (email 値は redact) |
| F-06 | D1 batch 失敗 (`D1_ERROR ...`) | `D1_ERROR ...` |
| F-07 | Mutex 二重取得試行 | `another sync is in progress` (status=skipped) |
| F-08 | SYNC_ADMIN_TOKEN 未設定 | (HTTP 500 / 監査未生成) |
| F-09 | SYNC_ADMIN_TOKEN 不一致 | (HTTP 401 / 監査未生成) |
| F-10 | env.GOOGLE_SERVICE_ACCOUNT_JSON 欠落 | `... 未設定` |
| F-11 | env.SHEETS_SPREADSHEET_ID 欠落 | `... 未設定` |
| F-12 | finishRun 内 update 失敗 | swallow（catch().catch(() => undefined)） |
| F-13 | releaseSyncLock 失敗 | swallow（同上） |
| F-14 | scheduled cursor 取得 0 件 | 通常分岐 (失敗ではない) |
| F-15 | scheduled 中 backfill 起動 | mutex 競合で skipped (F-07) |
| F-16 | backfill 中 schedule cron tick | 同上 |
| F-17 | TTL 切れ stale lock 再取得 | 監査は normal 起動で記録 |
| F-18 | DELETE FROM member_responses 後 batch 失敗 | 全体 rollback (D1 batch transaction) |
| F-19 | audit GET の不正 limit | HTTP 400 `invalid_limit` |
| F-20 | manual route HTTP 409 (skipped) | `sync_in_progress` |

## 実装上の不変条件確認

| invariant | 実装位置 | 確認方法 |
|-----------|----------|----------|
| #4 (admin 列保護) | `backfill.ts` の SQL は `member_responses` のみ | I-07 backfill テスト + grep `member_status\|member_identities\|meeting_sessions` in `apps/api/src/sync/*` |
| #5 (D1 直アクセス禁止 web) | `apps/api/src/sync/*` のみで完結 | grep `from "@ubm-hyogo/api/sync"` in `apps/web/` (期待 0 件) |
| #6 (no googleapis SDK) | `sheets-client.ts` は `GoogleSheetsFetcher` ラッパー | `grep googleapis apps/api` (期待 0 件) |

## TECH-M / TECH-Q トレース

| 識別子 | 設計事項 | 実装位置 |
|--------|----------|----------|
| TECH-M-01 | 単一 mutex (sync_locks) | `sync/audit.ts withSyncMutex` |
| TECH-M-02 | submittedAt cursor + responseId upsert | `scheduled.ts readLastSuccessCursor` + `sheets-client.ts fetchDelta` |
| TECH-M-03 | try/finally finalize | `sync/audit.ts withSyncMutex` |
| TECH-Q-01 | trigger 正規化 | `sync/audit.ts lockTriggerOf` |
| TECH-Q-02 | error redact (email) | `sync/audit.ts redact` |
| TECH-Q-03 | listRecent 上限 (limit ≤ 100) | `sync/audit-route.ts` + `audit.ts listRecent` |

## AC-7 / AC-12 確認

- AC-7 (`monitor`): `GET /admin/sync/audit` がページネーション対応 + 認証必須 → 実装済 (`sync/audit-route.ts`)、I-08/I-09 でカバー。
- AC-12 (`retry`): exponential backoff (500ms → 2s → 8s, max 3) は `sync/sheets-client.ts fetchWithBackoff` で固定。U-S-02/U-S-03/U-S-05 でカバー。

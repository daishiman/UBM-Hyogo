# Phase 4 成果物 — テスト戦略

## 1. テストレイヤと範囲

| レイヤ | 対象 | 検証ファイル | 主な観点 |
| --- | --- | --- | --- |
| unit | with-retry | `apps/api/src/utils/with-retry.test.ts` | retryable 判定 / backoff / maxRetries |
| unit | write-queue | `apps/api/src/utils/write-queue.test.ts` | FIFO 直列性 / 失敗継続 |
| unit | mapper | `apps/api/src/jobs/mappers/sheets-to-members.test.ts` | header→column / consent 正規化 / extra_fields |
| integration | runSync | `apps/api/src/jobs/sync-sheets-to-d1.test.ts` | lock/log/upsert/skip/failed/冪等性 |
| authorization | /admin/sync | `apps/api/src/routes/admin/sync.test.ts` | 401/200/500 のステータスコード |

## 2. テストフィクスチャ方針

- D1 は最小限の in-memory mock (`FakeD1`) で `prepare/bind/run/batch` を実装
- Sheets API は `SheetsFetcher` interface の mock 実装 (`FakeFetcher`) で代替
- 認証は `vi.mock('../../jobs/sync-sheets-to-d1')` で `runSync` をスタブして route ロジックのみ検証

## 3. AC × テスト マッピング

| AC | 検証テスト |
| --- | --- |
| AC-2 (mapping) | `mapSheetRows` 5 ケース |
| AC-3 (冪等性) | `runSync > 冪等性` |
| AC-4 (chunk) | `chunk` テスト |
| AC-5 (admin endpoint 認証) | `adminSyncRoute` 4 ケース |
| AC-6 (sync log) | `runSync > 成功時に sync_job_logs を success に更新` |
| AC-7 (retry/backoff/queue/batch) | `withRetry` / `WriteQueue` テスト + integration |

## 4. 実環境検証 (手動 smoke)

Phase 11 で `wrangler dev --test-scheduled` を用いて以下を確認する:

- `/__scheduled` POST → `sync_job_logs` に running→success 遷移
- `/admin/sync` POST → 同上 (trigger=admin)
- `wrangler tail` で構造化ログ取得

## 5. 既知の限界

- Cloudflare Workers ランタイム特有の挙動（subrequest 制限・CPU time）はローカル miniflare では完全再現できないため、staging deploy 後に再検証する (UT-26 連携)。
- Service Account JWT の本物署名検証は本テストでは行わず、stub fetcher で fetchRange のみ確認する。

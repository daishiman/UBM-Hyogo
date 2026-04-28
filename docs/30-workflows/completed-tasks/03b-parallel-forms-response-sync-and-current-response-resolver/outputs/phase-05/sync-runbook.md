# Sync Runbook — Forms Response Sync (03b)

`runResponseSync` の実行〜停止までの手順と、運用時に必要な判断基準を 1 枚にまとめた運用書。
本書は **オペレーター**（人間 + cron）両方を想定する。

## 起動経路

| trigger | 経路 | 認証 | 備考 |
|---------|------|------|------|
| `cron` | `scheduled()` → `*/15 * * * *` | （内部） | production / staging で同一スケジュール |
| `admin` | `POST /admin/sync/responses` | Bearer `SYNC_ADMIN_TOKEN` | `?fullSync=true` で cursor をリセット、`?cursor=<token>` で任意 token を直接渡せる |

## 正常系シーケンス

1. `start()` で `sync_jobs` に `running` 行を INSERT（`job_id = job-<uuid>`, `job_type='response_sync'`）
2. `tryAcquireResponseSyncLock(holder=jobId)` を呼び `sync_locks` に行を入れる。失敗 → `'skipped'`（→ route 409）
3. cursor 決定: `options.cursor` > `fullSync ? null : readLastCursor()` の順で確定
4. `pageToken` が定義済みのうちは loop:
   - `client.listResponses(formId, { pageSize: 100, pageToken })`
   - 各 response を `processResponse(db, resp)` に渡す
   - `writeCount >= writeCap` で break（既定 200 / `RESPONSE_SYNC_WRITE_CAP` で上書き可）
5. `metrics = { processedCount, writeCount, cursor: nextPageToken ?? null, ... }` を `succeed(jobId, metrics)` で書き戻す
6. `releaseResponseSyncLock(holder=jobId)` を実行（finally）

## 失敗系の取り扱い

| 状況 | 振る舞い | 観測点 |
|------|---------|--------|
| `client.listResponses` throw | `fail(jobId, err)` で sync_jobs を `failed` 化、lock は finally で release | `sync_jobs.error_json.code` |
| process 中の D1 write 例外 | 当該 response はスキップ、loop は継続（部分成功） | log + metrics の `errorCount` |
| process 中の brand 型不整合 | TypeScript 段階で reject（runtime には到達しない） | typecheck CI |
| `RESPONSE_SYNC_WRITE_CAP` 到達 | loop break → `succeeded` ＋ `cursor` 残し → 次回 cron で続行 | `metrics.cursor !== null` |
| lock 競合 | `'skipped'`（route 409） | `skippedReason` |

## 手動運用

```bash
# admin 強制起動
curl -X POST "$API_BASE/admin/sync/responses" \
  -H "Authorization: Bearer $SYNC_ADMIN_TOKEN"

# cursor を破棄して頭から再同期
curl -X POST "$API_BASE/admin/sync/responses?fullSync=true" \
  -H "Authorization: Bearer $SYNC_ADMIN_TOKEN"

# 残留した stale lock を排出（同 lockId に対する別 holder）
# wrangler は禁止 → scripts/cf.sh d1 execute で対応
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "DELETE FROM sync_locks WHERE id='response-sync' AND expires_at < datetime('now')"
```

## 観測ポイント

- `sync_jobs WHERE job_type='response_sync' ORDER BY started_at DESC LIMIT 20`
- `metrics_json.processedCount` / `writeCount` / `cursor`
- `schema_diff_queue WHERE status='queued'` の長さ（運用イベント）
- `sync_locks WHERE id='response-sync'` の有無（30 分以上残っていれば異常）

## 停止 / 巻き戻し

- migration 0005 の rollback は `DROP INDEX IF EXISTS idx_schema_diff_queue_question_open;` / `DROP INDEX IF EXISTS idx_response_fields_response;`
- cron は `apps/api/wrangler.toml` から `*/15 * * * *` を除去 → `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env <env>`
- アプリの実体ロールバックは `bash scripts/cf.sh rollback <VERSION_ID> --config apps/api/wrangler.toml --env production`

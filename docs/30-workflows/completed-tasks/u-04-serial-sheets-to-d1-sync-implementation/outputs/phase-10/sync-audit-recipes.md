# u-04 sync_job_logs クエリレシピ

実行は必ず `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command "..."` 経由。`wrangler` 直接禁止。

## R-01 直近成功 sync 1 件

```sql
SELECT * FROM sync_job_logs
WHERE status = 'success'
ORDER BY finished_at DESC
LIMIT 1;
```

## R-02 直近 24h の失敗一覧

```sql
SELECT run_id, trigger_type, status, started_at, finished_at, error_reason
FROM sync_job_logs
WHERE status = 'failed'
  AND started_at >= datetime('now', '-1 day')
ORDER BY started_at DESC;
```

## R-03 残留 running row (mutex 解放候補)

```sql
SELECT run_id, trigger_type, started_at,
       CAST((julianday('now') - julianday(started_at)) * 24 * 60 AS INTEGER) AS minutes_elapsed
FROM sync_job_logs
WHERE status = 'running'
ORDER BY started_at;
```

## R-04 平均実行時間 (直近 100 件成功)

```sql
SELECT trigger_type,
       AVG(duration_ms) AS avg_ms
FROM (
  SELECT trigger_type, duration_ms
  FROM sync_job_logs
  WHERE status = 'success'
  ORDER BY finished_at DESC
  LIMIT 100
)
GROUP BY trigger_type;
```

## R-05 差分件数推移 (直近 7 日)

```sql
SELECT date(started_at) AS day,
       trigger_type,
       COUNT(*) AS sync_count,
       SUM(upserted_count) AS upserted_total,
       SUM(failed_count) AS failed_total
FROM sync_job_logs
WHERE status = 'success'
  AND started_at >= datetime('now', '-7 day')
GROUP BY day, trigger_type
ORDER BY day DESC, trigger_type;
```

## R-06 mutex 強制解放 (運用者のみ、F-11 一次対応)

```sql
UPDATE sync_job_logs
SET status = 'failed',
    finished_at = datetime('now'),
    error_reason = 'manual_release'
WHERE run_id = ?  -- 必ず特定 run_id を指定
  AND status = 'running';
```

実行後は `sync_locks` の該当行も削除する:

```sql
DELETE FROM sync_locks WHERE lock_id = 'sheets-to-d1';
```

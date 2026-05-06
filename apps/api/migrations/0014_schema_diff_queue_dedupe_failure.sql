-- 0014_schema_diff_queue_dedupe_failure.sql
-- UT-07B-FU-01: schema alias back-fill queue/cron split.
-- duplicate enqueue 防止 + partial failure recovery + retry counter 上限。
-- 親タスク 0008 の backfill_cursor / backfill_status と直交。

ALTER TABLE schema_diff_queue ADD COLUMN dedupe_key TEXT;
ALTER TABLE schema_diff_queue ADD COLUMN failed_items_json TEXT;
ALTER TABLE schema_diff_queue ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE schema_diff_queue ADD COLUMN last_error TEXT;
ALTER TABLE schema_diff_queue ADD COLUMN last_processed_at TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_schema_diff_queue_dedupe_key
  ON schema_diff_queue(dedupe_key) WHERE dedupe_key IS NOT NULL;

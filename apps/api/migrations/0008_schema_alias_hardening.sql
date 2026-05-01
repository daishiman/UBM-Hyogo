-- 0008_schema_alias_hardening.sql
-- UT-07B: resumable back-fill state.

ALTER TABLE schema_diff_queue ADD COLUMN backfill_cursor TEXT;
ALTER TABLE schema_diff_queue ADD COLUMN backfill_status TEXT;

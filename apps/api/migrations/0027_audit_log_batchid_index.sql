-- 0027_audit_log_batchid_index.sql
-- Issue #1128: audit_log batchId lookup optimization.
-- The batch id is stored in after_json for assign rows and before_json for
-- unassign rows. A VIRTUAL generated column keeps the append path unchanged
-- while allowing an index-backed lookup.

ALTER TABLE audit_log
  ADD COLUMN batch_id TEXT GENERATED ALWAYS AS (
    COALESCE(
      CASE
        WHEN json_valid(after_json) THEN json_extract(after_json, '$.batchId')
        ELSE NULL
      END,
      CASE
        WHEN json_valid(before_json) THEN json_extract(before_json, '$.batchId')
        ELSE NULL
      END
    )
  ) VIRTUAL;

CREATE INDEX IF NOT EXISTS idx_audit_log_batch_id
  ON audit_log(batch_id, created_at DESC, audit_id DESC)
  WHERE batch_id IS NOT NULL;

-- Rollback:
-- DROP INDEX IF EXISTS idx_audit_log_batch_id;
-- ALTER TABLE audit_log DROP COLUMN batch_id;

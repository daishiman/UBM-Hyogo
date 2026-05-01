-- 0008_schema_alias_hardening.sql
-- UT-07B: schema alias write target + resumable back-fill state.

CREATE TABLE IF NOT EXISTS schema_aliases (
  id                TEXT PRIMARY KEY,
  revision_id       TEXT NOT NULL,
  stable_key        TEXT NOT NULL,
  alias_question_id TEXT NOT NULL,
  alias_label       TEXT,
  source            TEXT NOT NULL DEFAULT 'manual',
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_by       TEXT,
  resolved_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_schema_aliases_stable_key
  ON schema_aliases(stable_key);

CREATE UNIQUE INDEX IF NOT EXISTS idx_schema_aliases_revision_stablekey_unique
  ON schema_aliases(revision_id, stable_key)
  WHERE stable_key IS NOT NULL
    AND stable_key != 'unknown'
    AND stable_key NOT LIKE '__extra__:%';

CREATE UNIQUE INDEX IF NOT EXISTS idx_schema_aliases_revision_question_unique
  ON schema_aliases(revision_id, alias_question_id);

ALTER TABLE schema_diff_queue ADD COLUMN backfill_cursor TEXT;
ALTER TABLE schema_diff_queue ADD COLUMN backfill_status TEXT;

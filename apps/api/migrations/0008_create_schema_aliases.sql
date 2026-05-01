CREATE TABLE IF NOT EXISTS schema_aliases (
  id                TEXT PRIMARY KEY,
  stable_key        TEXT NOT NULL,
  alias_question_id TEXT NOT NULL UNIQUE,
  alias_label       TEXT,
  source            TEXT NOT NULL DEFAULT 'manual',
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  resolved_by       TEXT,
  resolved_at       TEXT
);

CREATE INDEX IF NOT EXISTS idx_schema_aliases_stable_key
  ON schema_aliases(stable_key);

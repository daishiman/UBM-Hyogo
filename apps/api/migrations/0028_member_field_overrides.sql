-- 0028_member_field_overrides.sql
-- member data source precedence: L1 admin override > L2 form response > L3 sheet seed.

ALTER TABLE member_identities
  ADD COLUMN seed_source TEXT;

ALTER TABLE member_identities
  ADD COLUMN seed_imported_at TEXT;

CREATE TABLE IF NOT EXISTS member_field_overrides (
  member_id     TEXT NOT NULL,
  stable_key    TEXT NOT NULL,
  value_json    TEXT,
  raw_value_json TEXT,
  updated_by    TEXT NOT NULL,
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (member_id, stable_key)
);

CREATE INDEX IF NOT EXISTS idx_member_field_overrides_member
  ON member_field_overrides(member_id);

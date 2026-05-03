-- 0011_identity_aliases.sql
-- issue-194-03b-followup-001-email-conflict-identity-merge
-- source_member_id -> target_member_id の canonical 解決テーブル。
-- UNIQUE(source_member_id) で二重 merge を抑止する。
CREATE TABLE IF NOT EXISTS identity_aliases (
  alias_id          TEXT PRIMARY KEY,
  source_member_id  TEXT NOT NULL,
  target_member_id  TEXT NOT NULL,
  created_by        TEXT NOT NULL,
  created_at        TEXT NOT NULL,
  reason_redacted   TEXT NOT NULL,
  UNIQUE (source_member_id)
);

CREATE INDEX IF NOT EXISTS idx_identity_aliases_target
  ON identity_aliases(target_member_id);

-- 0012_identity_conflict_dismissals.sql
-- issue-194-03b-followup-001-email-conflict-identity-merge
-- admin による「別人」マーク永続化。再検出を抑止する。
CREATE TABLE IF NOT EXISTS identity_conflict_dismissals (
  dismissal_id                TEXT PRIMARY KEY,
  source_member_id            TEXT NOT NULL,
  candidate_target_member_id  TEXT NOT NULL,
  dismissed_by                TEXT NOT NULL,
  reason                      TEXT NOT NULL,
  dismissed_at                TEXT NOT NULL,
  UNIQUE (source_member_id, candidate_target_member_id)
);

CREATE INDEX IF NOT EXISTS idx_identity_conflict_dismissals_source
  ON identity_conflict_dismissals(source_member_id);

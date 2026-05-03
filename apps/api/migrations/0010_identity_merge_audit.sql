-- 0010_identity_merge_audit.sql
-- issue-194-03b-followup-001-email-conflict-identity-merge
-- 不変条件 #13 admin audit logging: identity merge 操作の独立 audit 永続化テーブル
CREATE TABLE IF NOT EXISTS identity_merge_audit (
  audit_id          TEXT PRIMARY KEY,
  actor_admin_id    TEXT NOT NULL,
  source_member_id  TEXT NOT NULL,
  target_member_id  TEXT NOT NULL,
  reason            TEXT NOT NULL,
  merged_at         TEXT NOT NULL,
  sync_job_id       TEXT
);

CREATE INDEX IF NOT EXISTS idx_identity_merge_audit_target
  ON identity_merge_audit(target_member_id, merged_at);

CREATE INDEX IF NOT EXISTS idx_identity_merge_audit_source
  ON identity_merge_audit(source_member_id);

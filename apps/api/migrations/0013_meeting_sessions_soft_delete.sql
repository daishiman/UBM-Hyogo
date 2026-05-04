-- 0013_meeting_sessions_soft_delete.sql
-- 06c-E: admin meetings PATCH/delete contract.

ALTER TABLE meeting_sessions ADD COLUMN deleted_at TEXT;

CREATE INDEX IF NOT EXISTS idx_meeting_sessions_active_held_on
  ON meeting_sessions(deleted_at, held_on);

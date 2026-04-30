-- 0007_admin_member_notes_request_status.sql
-- 04b-followup-001: visibility_request / delete_request 行に処理状態メタを追加。
-- 不変条件 #4: response_fields には触れない（admin_member_notes 単独変更）
-- 不変条件 #5: D1 操作は apps/api 配下のみ
-- 不変条件 #11: member 本文（member_responses）には触れない

ALTER TABLE admin_member_notes
  ADD COLUMN request_status TEXT;

ALTER TABLE admin_member_notes
  ADD COLUMN resolved_at INTEGER;

ALTER TABLE admin_member_notes
  ADD COLUMN resolved_by_admin_id TEXT;

-- backfill: 既存の request 行を pending 化（general 行は NULL のまま）
UPDATE admin_member_notes
   SET request_status = 'pending'
 WHERE note_type IN ('visibility_request', 'delete_request')
   AND request_status IS NULL;

-- partial index: pending 行のみを対象に高速検索（hasPendingRequest のホットパス）
CREATE INDEX IF NOT EXISTS idx_admin_notes_pending_requests
  ON admin_member_notes (member_id, note_type)
  WHERE request_status = 'pending';

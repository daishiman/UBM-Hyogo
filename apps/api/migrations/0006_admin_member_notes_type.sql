-- 0006_admin_member_notes_type.sql
-- 04b: member self-service API
-- admin_member_notes に note_type 列を追加し、visibility_request / delete_request の queue として使う。
-- 不変条件 #4: 本文（response_fields）に書き込まないため、申請は別テーブルではなく
--             admin_member_notes の note_type 列で表現する（Phase 3 の Alternative C 却下根拠と整合）。
-- 不変条件 #12: admin_member_notes は public/member view model に絶対に混ざらない。
--               本マイグレーションは admin_member_notes の構造のみ変更し、view model には触れない。

ALTER TABLE admin_member_notes
  ADD COLUMN note_type TEXT NOT NULL DEFAULT 'general';

-- 同一 member × note_type で pending な申請を判別するための部分 INDEX。
-- "pending" は本テーブルでは status 列を持たないため、type ごとの最新行を 1 件以下にする運用判定に利用する。
CREATE INDEX IF NOT EXISTS idx_admin_notes_member_type
  ON admin_member_notes(member_id, note_type, created_at);

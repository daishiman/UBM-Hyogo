-- ut-02a-followup-002 attendance dashboard analytics 専用 index
-- session 側は 0002 の idx_member_attendance_session を流用する。
-- meeting 側は 0013 の idx_meeting_sessions_active_held_on を流用する。
-- ranking 側で member_id 軸の lookup を index で安定化させるため追加する。
CREATE INDEX IF NOT EXISTS idx_member_attendance_member
  ON member_attendance (member_id);

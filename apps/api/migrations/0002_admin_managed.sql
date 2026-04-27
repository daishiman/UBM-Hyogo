-- 0002_admin_managed.sql
-- admin-managed domain (8 tables) + 関連 INDEX
-- 不変条件: #2 (consent), #15 (attendance 重複阻止)

CREATE TABLE IF NOT EXISTS member_status (
  member_id        TEXT PRIMARY KEY,
  public_consent   TEXT    NOT NULL DEFAULT 'unknown',  -- consented / declined / unknown
  rules_consent    TEXT    NOT NULL DEFAULT 'unknown',
  publish_state    TEXT    NOT NULL DEFAULT 'member_only',
  is_deleted       INTEGER NOT NULL DEFAULT 0,
  hidden_reason    TEXT,
  last_notified_at TEXT,
  updated_by       TEXT,
  updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS meeting_sessions (
  session_id  TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  held_on     TEXT NOT NULL,
  note        TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  created_by  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS member_attendance (
  member_id    TEXT NOT NULL,
  session_id   TEXT NOT NULL,
  assigned_at  TEXT NOT NULL DEFAULT (datetime('now')),
  assigned_by  TEXT NOT NULL,
  PRIMARY KEY (member_id, session_id)
);

CREATE TABLE IF NOT EXISTS tag_definitions (
  tag_id                  TEXT PRIMARY KEY,
  code                    TEXT    NOT NULL UNIQUE,
  label                   TEXT    NOT NULL,
  category                TEXT    NOT NULL,
  source_stable_keys_json TEXT    NOT NULL DEFAULT '[]',
  active                  INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS member_tags (
  member_id    TEXT NOT NULL,
  tag_id       TEXT NOT NULL,
  source       TEXT NOT NULL,
  confidence   REAL,
  assigned_at  TEXT NOT NULL DEFAULT (datetime('now')),
  assigned_by  TEXT,
  PRIMARY KEY (member_id, tag_id)
);

CREATE TABLE IF NOT EXISTS tag_assignment_queue (
  queue_id             TEXT PRIMARY KEY,
  member_id            TEXT    NOT NULL,
  response_id          TEXT    NOT NULL,
  status               TEXT    NOT NULL DEFAULT 'queued',
  suggested_tags_json  TEXT    NOT NULL DEFAULT '[]',
  reason               TEXT,
  created_at           TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at           TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_member_notes (
  note_id     TEXT PRIMARY KEY,
  member_id   TEXT NOT NULL,
  body        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  created_by  TEXT NOT NULL,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS deleted_members (
  member_id   TEXT PRIMARY KEY,
  deleted_by  TEXT NOT NULL,
  deleted_at  TEXT NOT NULL DEFAULT (datetime('now')),
  reason      TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_member_status_public
  ON member_status(public_consent, publish_state, is_deleted);
CREATE INDEX IF NOT EXISTS idx_member_attendance_session
  ON member_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_member_tags_member
  ON member_tags(member_id);
CREATE INDEX IF NOT EXISTS idx_tag_queue_status
  ON tag_assignment_queue(status, created_at);
CREATE INDEX IF NOT EXISTS idx_admin_notes_member
  ON admin_member_notes(member_id, updated_at);

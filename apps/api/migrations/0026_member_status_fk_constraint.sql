-- 0026_member_status_fk_constraint.sql
-- Add the member_status.member_id -> member_identities(member_id) FK by
-- rebuilding the SQLite table. 0025_backfill_member_status.sql must run first.

PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS member_status_new;

CREATE TABLE IF NOT EXISTS member_status_new (
  member_id              TEXT PRIMARY KEY,
  public_consent         TEXT    NOT NULL DEFAULT 'unknown',
  rules_consent          TEXT    NOT NULL DEFAULT 'unknown',
  publish_state          TEXT    NOT NULL DEFAULT 'member_only',
  is_deleted             INTEGER NOT NULL DEFAULT 0,
  hidden_reason          TEXT,
  last_notified_at       TEXT,
  updated_by             TEXT,
  updated_at             TEXT    NOT NULL DEFAULT (datetime('now')),
  notification_opt_out   INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (member_id) REFERENCES member_identities(member_id)
);

INSERT OR IGNORE INTO member_status_new (
  member_id,
  public_consent,
  rules_consent,
  publish_state,
  is_deleted,
  hidden_reason,
  last_notified_at,
  updated_by,
  updated_at,
  notification_opt_out
)
SELECT
  member_id,
  public_consent,
  rules_consent,
  publish_state,
  is_deleted,
  hidden_reason,
  last_notified_at,
  updated_by,
  updated_at,
  notification_opt_out
FROM member_status;

PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS member_status;
ALTER TABLE member_status_new RENAME TO member_status;

CREATE INDEX IF NOT EXISTS idx_member_status_public
  ON member_status(public_consent, publish_state, is_deleted);

PRAGMA foreign_keys = ON;

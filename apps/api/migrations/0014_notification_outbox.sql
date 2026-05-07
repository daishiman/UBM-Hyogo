-- 0014_notification_outbox.sql
-- Issue #401: admin resolve 後の member 通知 (outbox + ledger)
-- resolve transaction とは疎結合な outbox + dispatch worker パターン。

CREATE TABLE IF NOT EXISTS notification_outbox (
  notification_id     TEXT PRIMARY KEY,
  note_id             TEXT NOT NULL,
  member_id           TEXT NOT NULL,
  recipient_email     TEXT NOT NULL,
  outcome             TEXT NOT NULL CHECK (outcome IN ('approved', 'rejected')),
  request_type        TEXT NOT NULL CHECK (request_type IN ('visibility_request', 'delete_request')),
  reason_summary      TEXT,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'dispatching', 'sent', 'dlq')),
  retry_count         INTEGER NOT NULL DEFAULT 0,
  next_attempt_at     TEXT NOT NULL,
  last_error          TEXT,
  provider_message_id TEXT,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL,
  UNIQUE (note_id, outcome)
);

CREATE INDEX IF NOT EXISTS idx_notification_outbox_pending
  ON notification_outbox (status, next_attempt_at);

CREATE TABLE IF NOT EXISTS notification_ledger (
  ledger_id        TEXT PRIMARY KEY,
  notification_id  TEXT NOT NULL,
  event_type       TEXT NOT NULL CHECK (event_type IN ('enqueued', 'dispatching', 'sent', 'failed', 'dlq')),
  attempt          INTEGER NOT NULL,
  detail_json      TEXT,
  created_at       TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notification_ledger_notification
  ON notification_ledger (notification_id);

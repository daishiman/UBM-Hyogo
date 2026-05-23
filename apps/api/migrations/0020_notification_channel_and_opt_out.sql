-- 0020_notification_channel_and_opt_out.sql
-- Issue #55: NotificationChannel abstraction + member opt-out gate
--
-- 1. member_status.notification_opt_out (0/1, default 0)
-- 2. notification_outbox.channel TEXT NOT NULL DEFAULT 'mail'
-- 3. notification_ledger.event_type CHECK enum 拡張
--    既存: enqueued / dispatching / sent / failed / dlq
--    追加: skipped_opt_out / unknown_channel
--
-- CHECK 制約は ALTER で変更できないため ledger テーブルを rebuild する (forward-only).

ALTER TABLE member_status
  ADD COLUMN notification_opt_out INTEGER NOT NULL DEFAULT 0;

ALTER TABLE notification_outbox
  ADD COLUMN channel TEXT NOT NULL DEFAULT 'mail';

CREATE TABLE notification_ledger__new (
  ledger_id        TEXT PRIMARY KEY,
  notification_id  TEXT NOT NULL,
  event_type       TEXT NOT NULL CHECK (event_type IN (
    'enqueued',
    'dispatching',
    'sent',
    'failed',
    'dlq',
    'skipped_opt_out',
    'unknown_channel'
  )),
  attempt          INTEGER NOT NULL,
  detail_json      TEXT,
  created_at       TEXT NOT NULL
);

INSERT INTO notification_ledger__new
  (ledger_id, notification_id, event_type, attempt, detail_json, created_at)
SELECT ledger_id, notification_id, event_type, attempt, detail_json, created_at
FROM notification_ledger;

DROP TABLE notification_ledger;
ALTER TABLE notification_ledger__new RENAME TO notification_ledger;

CREATE INDEX IF NOT EXISTS idx_notification_ledger_notification
  ON notification_ledger (notification_id);

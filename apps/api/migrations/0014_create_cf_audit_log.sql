-- 0014_create_cf_audit_log.sql
-- Issue #408: Cloudflare Audit Logs monitoring schema.
-- 30 day TTL purge は analyze.ts 末尾の DELETE で行う (schedule 駆動)。

CREATE TABLE IF NOT EXISTS cf_audit_log (
  id              TEXT PRIMARY KEY,
  occurred_at     TEXT NOT NULL,
  occurred_at_ms  INTEGER NOT NULL,
  actor_email     TEXT,
  actor_ip        TEXT,
  actor_ua        TEXT,
  action_type     TEXT NOT NULL,
  action_result   TEXT NOT NULL,
  result_code     INTEGER,
  resource_type   TEXT,
  resource_id     TEXT,
  raw_json        TEXT NOT NULL,
  ingested_at_ms  INTEGER NOT NULL,
  severity        TEXT,
  issue_number    INTEGER
);

CREATE INDEX IF NOT EXISTS idx_cf_audit_log_occurred ON cf_audit_log(occurred_at_ms);
CREATE INDEX IF NOT EXISTS idx_cf_audit_log_actor    ON cf_audit_log(actor_email, occurred_at_ms);
CREATE INDEX IF NOT EXISTS idx_cf_audit_log_severity ON cf_audit_log(severity, occurred_at_ms);

CREATE TABLE IF NOT EXISTS cf_audit_baseline (
  key         TEXT PRIMARY KEY,
  value_num   REAL NOT NULL,
  computed_at TEXT NOT NULL,
  window_days INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS cf_audit_finding_dedupe (
  finding_hash  TEXT PRIMARY KEY,
  issue_number  INTEGER NOT NULL,
  created_at_ms INTEGER NOT NULL
);

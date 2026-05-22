-- migration: audit_correlation_findings
-- Issue #553 / U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-01
-- redact-safe な finding 履歴。secret / 完全 IP / 完全 email local-part / 完全 UA / salt literal は保存しない。

CREATE TABLE IF NOT EXISTS audit_correlation_findings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fingerprint_hash_prefix TEXT NOT NULL,
  fingerprint_version INTEGER NOT NULL,
  actor_domain TEXT,
  ip_prefix TEXT,
  ua_bucket TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('LOW','MEDIUM','HIGH')),
  event_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  observed_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_audit_corr_fp_obs_evt
  ON audit_correlation_findings(fingerprint_hash_prefix, observed_at, event_type);

CREATE INDEX IF NOT EXISTS idx_audit_corr_severity_observed
  ON audit_correlation_findings(severity, observed_at);

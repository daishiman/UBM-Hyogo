-- Issue #315 (Refs): Application audit_log cold storage 2-phase commit manifest
-- cf_audit_log_export_manifest (0015) のスキーマ構造を踏襲。

CREATE TABLE IF NOT EXISTS audit_log_export_manifest (
  id                        TEXT PRIMARY KEY,
  export_run_id             TEXT NOT NULL,
  yyyy                      INTEGER NOT NULL,
  mm                        INTEGER NOT NULL,
  dd                        INTEGER NOT NULL,
  object_key                TEXT NOT NULL,
  row_count                 INTEGER NOT NULL,
  uncompressed_bytes        INTEGER NOT NULL,
  compressed_bytes          INTEGER NOT NULL,
  sha256                    TEXT NOT NULL,
  r2_etag                   TEXT,
  redaction_policy_version  TEXT NOT NULL DEFAULT 'v1',
  status                    TEXT NOT NULL CHECK (status IN ('pending','completed','failed')),
  started_at                TEXT NOT NULL,
  completed_at              TEXT,
  error_message             TEXT,
  UNIQUE (yyyy, mm, dd)
);

CREATE INDEX IF NOT EXISTS idx_audit_log_export_manifest_status
  ON audit_log_export_manifest (status, started_at);

CREATE INDEX IF NOT EXISTS idx_audit_log_export_manifest_run
  ON audit_log_export_manifest (export_run_id);

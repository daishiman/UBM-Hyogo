-- Issue #514: Cloudflare Audit Logs cold storage / R2 export
-- Phase 2 schema 準拠の manifest テーブル。export 実績の 2-phase commit を支える。

CREATE TABLE IF NOT EXISTS cf_audit_log_export_manifest (
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

CREATE INDEX IF NOT EXISTS idx_cf_audit_export_manifest_status
  ON cf_audit_log_export_manifest (status, started_at);

CREATE INDEX IF NOT EXISTS idx_cf_audit_export_manifest_run
  ON cf_audit_log_export_manifest (export_run_id);

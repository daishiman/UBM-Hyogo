-- ============================================================================
-- Issue #408 — Cloudflare Audit Logs monitoring schema
-- 出力元: docs/30-workflows/issue-408-cf-audit-logs-monitoring/outputs/phase-2/
-- 適用先: D1 (ubm-hyogo-db-prod / staging)
-- 注意: Phase 5 で `apps/api/migrations/0014_create_cf_audit_log.sql` に
--       sequence 番号付きでコピー配置する。本ファイルは正本 DDL の抜粋。
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) cf_audit_log: Cloudflare audit event の永続化テーブル
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cf_audit_log (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id          TEXT    NOT NULL UNIQUE,
  actor_email       TEXT,
  actor_ip          TEXT,
  actor_user_agent  TEXT,
  action            TEXT    NOT NULL,
  resource_type     TEXT,
  resource_id       TEXT,
  outcome           TEXT    NOT NULL,
  metadata_json     TEXT,
  event_timestamp   INTEGER NOT NULL,
  ingested_at_ms    INTEGER NOT NULL,
  severity          TEXT,
  CHECK (outcome IN ('success', 'failure')),
  CHECK (severity IS NULL OR severity IN ('HIGH', 'MEDIUM', 'LOW'))
);

CREATE INDEX IF NOT EXISTS idx_cf_audit_log_event_ts ON cf_audit_log(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_cf_audit_log_outcome  ON cf_audit_log(outcome, event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_cf_audit_log_severity ON cf_audit_log(severity) WHERE severity IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cf_audit_log_actor_ip ON cf_audit_log(actor_ip, event_timestamp DESC);

-- ----------------------------------------------------------------------------
-- 2) cf_audit_baseline: 7 日学習で得た閾値・許可 IP set の世代管理テーブル
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cf_audit_baseline (
  id                          INTEGER PRIMARY KEY AUTOINCREMENT,
  window_start                INTEGER NOT NULL,
  window_end                  INTEGER NOT NULL,
  hourly_call_count_p99       INTEGER NOT NULL,
  hourly_failure_count_p99    INTEGER NOT NULL,
  allowed_ip_set_json         TEXT    NOT NULL,
  allowed_action_set_json     TEXT    NOT NULL,
  business_hours_jst_start    INTEGER NOT NULL DEFAULT 9,
  business_hours_jst_end      INTEGER NOT NULL DEFAULT 19,
  rotation_window_json        TEXT,
  created_at                  INTEGER NOT NULL DEFAULT (unixepoch()),
  is_active                   INTEGER NOT NULL DEFAULT 1,
  CHECK (window_end > window_start),
  CHECK (is_active IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_cf_audit_baseline_active ON cf_audit_baseline(is_active, window_end DESC);

-- Issue #836: schema alias rollback 後の再集計（recompute）job 追跡テーブル。
-- recompute = response_fields の reverse-backfill（alias.stable_key -> __extra__:{question_id}）。
-- idempotency: (alias_id, stable_key, trigger_key) UNIQUE。同一 trigger の再実行を吸収する。
CREATE TABLE IF NOT EXISTS schema_alias_recompute_jobs (
  job_id          TEXT PRIMARY KEY,
  alias_id        TEXT NOT NULL,
  stable_key      TEXT NOT NULL,
  question_id     TEXT NOT NULL,
  trigger_key     TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending',  -- pending | running | completed | failed
  affected_count  INTEGER NOT NULL DEFAULT 0,
  processed_count INTEGER NOT NULL DEFAULT 0,
  updated_count   INTEGER NOT NULL DEFAULT 0,
  deleted_collision_count INTEGER NOT NULL DEFAULT 0,
  cursor          TEXT,
  recompute_audit_id TEXT,
  locked_at       TEXT,
  locked_by       TEXT,
  run_token       TEXT,
  last_error      TEXT,
  created_by      TEXT NOT NULL,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

-- idempotency 制約: 同一 alias × stable_key × trigger_key は 1 job のみ
CREATE UNIQUE INDEX IF NOT EXISTS idx_schema_alias_recompute_jobs_trigger_unique
  ON schema_alias_recompute_jobs (alias_id, stable_key, trigger_key);

-- alias 単位の直近 job 取得用
CREATE INDEX IF NOT EXISTS idx_schema_alias_recompute_jobs_alias
  ON schema_alias_recompute_jobs (alias_id, created_at);

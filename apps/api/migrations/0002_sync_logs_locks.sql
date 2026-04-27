-- UT-09: Sheets→D1 同期ジョブ用テーブル
-- - sync_locks: 二重実行防止 (TTL 付きロック)
-- - sync_job_logs: 実行ログ (run_id 単位、Phase 9/11 で参照)
-- 既存の sync_audit テーブルとは別に、ジョブ運用視点の集計用ログを分離して保持する。

CREATE TABLE IF NOT EXISTS sync_locks (
  id              TEXT    PRIMARY KEY,           -- ロック識別子 (例: 'sheets-to-d1')
  acquired_at     TEXT    NOT NULL,              -- ISO8601
  expires_at      TEXT    NOT NULL,              -- ISO8601 (TTL)
  holder          TEXT    NOT NULL,              -- run_id
  trigger_type    TEXT    NOT NULL               -- cron / admin / backfill
);

CREATE TABLE IF NOT EXISTS sync_job_logs (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id            TEXT    NOT NULL UNIQUE,
  trigger_type      TEXT    NOT NULL,            -- cron / admin / backfill
  status            TEXT    NOT NULL,            -- running / success / failed / skipped
  started_at        TEXT    NOT NULL,
  finished_at       TEXT,
  fetched_count     INTEGER NOT NULL DEFAULT 0,
  upserted_count    INTEGER NOT NULL DEFAULT 0,
  failed_count      INTEGER NOT NULL DEFAULT 0,
  retry_count       INTEGER NOT NULL DEFAULT 0,
  duration_ms       INTEGER,
  error_reason      TEXT
);

CREATE INDEX IF NOT EXISTS idx_sync_job_logs_started   ON sync_job_logs(started_at);
CREATE INDEX IF NOT EXISTS idx_sync_job_logs_status    ON sync_job_logs(status, started_at);

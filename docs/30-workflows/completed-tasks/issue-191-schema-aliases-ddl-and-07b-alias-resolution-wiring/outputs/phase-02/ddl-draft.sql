-- migrations/<NNNN>_create_schema_aliases.sql
-- issue-191: schema_aliases DDL (draft, spec_created)
-- 実マイグレーション番号 <NNNN> は実装時に `ls apps/api/migrations` で最終番号 +1 を採用する。

CREATE TABLE IF NOT EXISTS schema_aliases (
  id                TEXT PRIMARY KEY,                 -- ULID 推奨
  stable_key        TEXT NOT NULL,                    -- 解決後の正規 stableKey
  alias_question_id TEXT NOT NULL,                    -- Google Forms の question_id
  alias_label       TEXT,                             -- 解決時点の question label snapshot（nullable）
  source            TEXT NOT NULL DEFAULT 'manual',   -- 'manual' | 'auto' | 'migration'
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_by       TEXT,                             -- admin user id（07b 書き込み元）
  resolved_at       TEXT,                             -- 解決確定時刻
  UNIQUE (alias_question_id)
);

CREATE INDEX IF NOT EXISTS idx_schema_aliases_stable_key
  ON schema_aliases (stable_key);

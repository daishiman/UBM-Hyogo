-- UBM兵庫支部会 D1 初期スキーマ
-- sync direction: Google Sheets → D1（一方向）
-- consent キー: public_consent / rules_consent（Sheets の publicConsent / rulesConsent を正規化）
-- responseEmail: system field → response_email 列
-- admin-managed データは admin_overrides テーブルに分離（不変条件 4）

-- Form 回答の正本テーブル（sync worker が Sheets から書き込む）
CREATE TABLE IF NOT EXISTS member_responses (
  id                        INTEGER PRIMARY KEY AUTOINCREMENT,
  response_id               TEXT    NOT NULL UNIQUE,  -- Sheets 行を一意識別するキー（冪等性確保）
  response_email            TEXT    NOT NULL,          -- system field（不変条件 3）
  submitted_at              TEXT    NOT NULL,          -- タイムスタンプ（ISO 8601）

  -- section1: basic_profile
  full_name                 TEXT,
  nickname                  TEXT,
  location                  TEXT,
  birth_date                TEXT,
  occupation                TEXT,
  hometown                  TEXT,

  -- section2: ubm_profile
  ubm_zone                  TEXT,
  ubm_membership_type       TEXT,
  ubm_join_date             TEXT,
  business_overview         TEXT,
  skills                    TEXT,
  challenges                TEXT,
  can_provide               TEXT,

  -- section3: personal_profile
  hobbies                   TEXT,
  recent_interest           TEXT,
  motto                     TEXT,
  other_activities          TEXT,

  -- section4: social_links
  url_website               TEXT,
  url_facebook              TEXT,
  url_instagram             TEXT,
  url_threads               TEXT,
  url_youtube               TEXT,
  url_tiktok                TEXT,
  url_x                     TEXT,
  url_blog                  TEXT,
  url_note                  TEXT,
  url_linkedin              TEXT,
  url_others                TEXT,

  -- section5: message
  self_introduction         TEXT,

  -- section6: consent（不変条件 2）
  public_consent            TEXT    NOT NULL DEFAULT 'unknown', -- consented / declined / unknown
  rules_consent             TEXT    NOT NULL DEFAULT 'unknown',

  -- schema 拡張余地（不変条件 1）
  extra_fields_json         TEXT,                      -- 未知の Form 質問を格納
  unmapped_question_ids_json TEXT,                     -- mapping 外 questionId を記録

  created_at                TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at                TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- 会員ステータス（admin-managed、sync 対象外）
CREATE TABLE IF NOT EXISTS member_status (
  id                        INTEGER PRIMARY KEY AUTOINCREMENT,
  response_id               TEXT    NOT NULL UNIQUE REFERENCES member_responses(response_id),
  publish_state             TEXT    NOT NULL DEFAULT 'draft',   -- draft / published / hidden
  is_deleted                INTEGER NOT NULL DEFAULT 0,
  hidden_reason             TEXT,
  created_at                TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at                TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- admin が手動管理するデータ（Form schema 外、不変条件 4）
CREATE TABLE IF NOT EXISTS admin_overrides (
  id                        INTEGER PRIMARY KEY AUTOINCREMENT,
  response_id               TEXT    NOT NULL REFERENCES member_responses(response_id),
  field_name                TEXT    NOT NULL,
  field_value               TEXT,
  overridden_by             TEXT,
  created_at                TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- sync 実行ログ（audit log）
CREATE TABLE IF NOT EXISTS sync_audit (
  id                        INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id                    TEXT    NOT NULL UNIQUE,   -- UUID
  trigger_type              TEXT    NOT NULL,          -- manual / scheduled / backfill
  started_at                TEXT    NOT NULL,
  finished_at               TEXT,
  rows_fetched              INTEGER,
  rows_upserted             INTEGER,
  rows_skipped              INTEGER,
  status                    TEXT    NOT NULL DEFAULT 'running', -- running / success / partial_failure / failure
  error_reason              TEXT,                      -- 失敗時の理由
  diff_summary_json         TEXT                       -- 変更サマリ（JSON）
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_member_responses_email      ON member_responses(response_email);
CREATE INDEX IF NOT EXISTS idx_member_responses_submitted  ON member_responses(submitted_at);
CREATE INDEX IF NOT EXISTS idx_member_status_publish       ON member_status(publish_state);
CREATE INDEX IF NOT EXISTS idx_sync_audit_trigger          ON sync_audit(trigger_type, started_at);

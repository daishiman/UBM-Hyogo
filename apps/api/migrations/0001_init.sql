-- 0001_init.sql
-- form-driven domain (8 tables) + 関連 INDEX
-- 不変条件: #1 (stable_key 抽象), #2 (consent), #3 (response_email system field), #7 (response_id / member_id 別 PK)

CREATE TABLE IF NOT EXISTS schema_versions (
  revision_id          TEXT PRIMARY KEY,
  form_id              TEXT    NOT NULL,
  schema_hash          TEXT    NOT NULL,
  state                TEXT    NOT NULL DEFAULT 'active',
  synced_at            TEXT    NOT NULL DEFAULT (datetime('now')),
  field_count          INTEGER NOT NULL DEFAULT 0,
  unknown_field_count  INTEGER NOT NULL DEFAULT 0,
  source_url           TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS schema_questions (
  question_pk          TEXT PRIMARY KEY,
  revision_id          TEXT    NOT NULL,
  stable_key           TEXT    NOT NULL,
  question_id          TEXT,
  item_id              TEXT,
  section_key          TEXT    NOT NULL,
  section_title        TEXT    NOT NULL,
  label                TEXT    NOT NULL,
  kind                 TEXT    NOT NULL,
  position             INTEGER NOT NULL,
  required             INTEGER NOT NULL DEFAULT 0,
  visibility           TEXT    NOT NULL DEFAULT 'public',
  searchable           INTEGER NOT NULL DEFAULT 1,
  source               TEXT    NOT NULL DEFAULT 'forms',
  status               TEXT    NOT NULL DEFAULT 'active',
  choice_labels_json   TEXT    NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS schema_diff_queue (
  diff_id              TEXT PRIMARY KEY,
  revision_id          TEXT    NOT NULL,
  type                 TEXT    NOT NULL,
  question_id          TEXT,
  stable_key           TEXT,
  label                TEXT    NOT NULL,
  suggested_stable_key TEXT,
  status               TEXT    NOT NULL DEFAULT 'queued',
  resolved_by          TEXT,
  resolved_at          TEXT,
  created_at           TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS member_responses (
  response_id                TEXT PRIMARY KEY,
  form_id                    TEXT    NOT NULL,
  revision_id                TEXT    NOT NULL,
  schema_hash                TEXT    NOT NULL,
  -- NOTE: response_email に UNIQUE は付与しない。member_responses は履歴行のため
  --       同一 email で複数 row を許容する。正本 UNIQUE は member_identities.response_email
  --       （本 file 行 90 付近）に存在する。
  response_email             TEXT,
  submitted_at               TEXT    NOT NULL,
  edit_response_url          TEXT,
  answers_json               TEXT    NOT NULL,
  raw_answers_json           TEXT    NOT NULL DEFAULT '{}',
  extra_fields_json          TEXT    NOT NULL DEFAULT '{}',
  unmapped_question_ids_json TEXT    NOT NULL DEFAULT '[]',
  search_text                TEXT    NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS response_sections (
  response_id     TEXT    NOT NULL,
  section_key     TEXT    NOT NULL,
  section_title   TEXT    NOT NULL,
  position        INTEGER NOT NULL,
  PRIMARY KEY (response_id, section_key)
);

CREATE TABLE IF NOT EXISTS response_fields (
  response_id     TEXT NOT NULL,
  stable_key      TEXT NOT NULL,
  value_json      TEXT,
  raw_value_json  TEXT,
  PRIMARY KEY (response_id, stable_key)
);

CREATE TABLE IF NOT EXISTS member_field_visibility (
  member_id   TEXT NOT NULL,
  stable_key  TEXT NOT NULL,
  visibility  TEXT NOT NULL,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (member_id, stable_key)
);

CREATE TABLE IF NOT EXISTS member_identities (
  member_id           TEXT PRIMARY KEY,
  -- NOTE: 正本 UNIQUE。response_email の一意性はここで保証する。
  --       member_responses 側には UNIQUE を付与しない（履歴行のため）。
  response_email      TEXT NOT NULL UNIQUE,
  current_response_id TEXT NOT NULL,
  first_response_id   TEXT NOT NULL,
  last_submitted_at   TEXT NOT NULL,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_member_responses_email_submitted
  ON member_responses(response_email, submitted_at);
CREATE INDEX IF NOT EXISTS idx_schema_diff_status
  ON schema_diff_queue(status, created_at);
CREATE INDEX IF NOT EXISTS idx_schema_questions_revision
  ON schema_questions(revision_id, stable_key);

CREATE VIEW IF NOT EXISTS members AS
SELECT
  mi.member_id,
  mi.response_email,
  mi.current_response_id,
  mi.last_submitted_at,
  mr.form_id,
  mr.revision_id,
  mr.schema_hash,
  mr.search_text,
  mr.submitted_at
FROM member_identities mi
JOIN member_responses mr
  ON mr.response_id = mi.current_response_id;

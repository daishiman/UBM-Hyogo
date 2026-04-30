# Phase 2: schema-design.md

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-04 D1 データスキーマ設計 |
| Phase | 2 / 13（設計） |
| visualEvidence | NON_VISUAL |
| 出典 | `apps/api/migrations/0001_init.sql` 〜 `0006_admin_member_notes_type.sql` |
| 正本リファレンス | `.claude/skills/aiworkflow-requirements/references/database-schema.md` |

## 1. Canonical table set

本タスクの正本テーブルは 6 個。下記はすべて既存 migration から抽出した実 DDL である（変更不可）。

| # | テーブル | 由来 migration | 役割 |
| --- | --- | --- | --- |
| 1 | `member_responses` | 0001_init.sql | Forms 回答正本（response_id 単位） |
| 2 | `member_identities` | 0001_init.sql | response_email 単位の同一人物束ね |
| 3 | `member_status` | 0002_admin_managed.sql | consent / publish_state 等 admin-managed 状態 |
| 4 | `response_fields` | 0001_init.sql | (response_id, stable_key) 単位の正規化値ストア |
| 5 | `schema_diff_queue` | 0001_init.sql + 0005_response_sync.sql | Forms schema 差分キュー |
| 6 | `sync_jobs` | 0003_auth_support.sql | schema_sync / response_sync ジョブログ |

## 2. 実 DDL（既存 migration からの抽出）

### 2.1 `member_responses`（0001_init.sql）

```sql
CREATE TABLE IF NOT EXISTS member_responses (
  response_id                TEXT PRIMARY KEY,
  form_id                    TEXT    NOT NULL,
  revision_id                TEXT    NOT NULL,
  schema_hash                TEXT    NOT NULL,
  response_email             TEXT,
  submitted_at               TEXT    NOT NULL,
  edit_response_url          TEXT,
  answers_json               TEXT    NOT NULL,
  raw_answers_json           TEXT    NOT NULL DEFAULT '{}',
  extra_fields_json          TEXT    NOT NULL DEFAULT '{}',
  unmapped_question_ids_json TEXT    NOT NULL DEFAULT '[]',
  search_text                TEXT    NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_member_responses_email_submitted
  ON member_responses(response_email, submitted_at);
```

### 2.2 `member_identities`（0001_init.sql）

```sql
CREATE TABLE IF NOT EXISTS member_identities (
  member_id           TEXT PRIMARY KEY,
  response_email      TEXT NOT NULL UNIQUE,
  current_response_id TEXT NOT NULL,
  first_response_id   TEXT NOT NULL,
  last_submitted_at   TEXT NOT NULL,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 2.3 `member_status`（0002_admin_managed.sql）

```sql
CREATE TABLE IF NOT EXISTS member_status (
  member_id        TEXT PRIMARY KEY,
  public_consent   TEXT    NOT NULL DEFAULT 'unknown',  -- consented / declined / unknown
  rules_consent    TEXT    NOT NULL DEFAULT 'unknown',
  publish_state    TEXT    NOT NULL DEFAULT 'member_only',
  is_deleted       INTEGER NOT NULL DEFAULT 0,
  hidden_reason    TEXT,
  last_notified_at TEXT,
  updated_by       TEXT,
  updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_member_status_public
  ON member_status(public_consent, publish_state, is_deleted);
```

### 2.4 `response_fields`（0001_init.sql + 0005_response_sync.sql）

```sql
CREATE TABLE IF NOT EXISTS response_fields (
  response_id     TEXT NOT NULL,
  stable_key      TEXT NOT NULL,
  value_json      TEXT,
  raw_value_json  TEXT,
  PRIMARY KEY (response_id, stable_key)
);

CREATE INDEX IF NOT EXISTS idx_response_fields_response
  ON response_fields(response_id);
```

### 2.5 `schema_diff_queue`（0001_init.sql + 0005_response_sync.sql）

```sql
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

CREATE INDEX IF NOT EXISTS idx_schema_diff_status
  ON schema_diff_queue(status, created_at);

-- partial UNIQUE: 同一 question_id の重複 enqueue を no-op 化（status='queued' のみ）
CREATE UNIQUE INDEX IF NOT EXISTS idx_schema_diff_queue_question_open
  ON schema_diff_queue(question_id)
  WHERE question_id IS NOT NULL AND status = 'queued';
```

### 2.6 `sync_jobs`（0003_auth_support.sql）

```sql
CREATE TABLE IF NOT EXISTS sync_jobs (
  job_id        TEXT PRIMARY KEY,
  job_type      TEXT NOT NULL,            -- schema_sync / response_sync
  started_at    TEXT NOT NULL,
  finished_at   TEXT,
  status        TEXT NOT NULL DEFAULT 'running',
  error_json    TEXT,
  metrics_json  TEXT NOT NULL DEFAULT '{}'
);
```

## 3. 補助テーブル（in scope, 既存 migration の DDL 抜粋）

### 3.1 schema スナップショット（0001_init.sql）

```sql
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

CREATE INDEX IF NOT EXISTS idx_schema_questions_revision
  ON schema_questions(revision_id, stable_key);

CREATE TABLE IF NOT EXISTS response_sections (
  response_id     TEXT    NOT NULL,
  section_key     TEXT    NOT NULL,
  section_title   TEXT    NOT NULL,
  position        INTEGER NOT NULL,
  PRIMARY KEY (response_id, section_key)
);
```

### 3.2 admin-managed（0002_admin_managed.sql / 0006_admin_member_notes_type.sql）

```sql
CREATE TABLE IF NOT EXISTS member_field_visibility (
  member_id   TEXT NOT NULL,
  stable_key  TEXT NOT NULL,
  visibility  TEXT NOT NULL,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (member_id, stable_key)
);

CREATE TABLE IF NOT EXISTS meeting_sessions (
  session_id  TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  held_on     TEXT NOT NULL,
  note        TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  created_by  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS member_attendance (
  member_id    TEXT NOT NULL,
  session_id   TEXT NOT NULL,
  assigned_at  TEXT NOT NULL DEFAULT (datetime('now')),
  assigned_by  TEXT NOT NULL,
  PRIMARY KEY (member_id, session_id)
);

CREATE TABLE IF NOT EXISTS tag_definitions (
  tag_id                  TEXT PRIMARY KEY,
  code                    TEXT    NOT NULL UNIQUE,
  label                   TEXT    NOT NULL,
  category                TEXT    NOT NULL,
  source_stable_keys_json TEXT    NOT NULL DEFAULT '[]',
  active                  INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS member_tags (
  member_id    TEXT NOT NULL,
  tag_id       TEXT NOT NULL,
  source       TEXT NOT NULL,
  confidence   REAL,
  assigned_at  TEXT NOT NULL DEFAULT (datetime('now')),
  assigned_by  TEXT,
  PRIMARY KEY (member_id, tag_id)
);

CREATE TABLE IF NOT EXISTS tag_assignment_queue (
  queue_id             TEXT PRIMARY KEY,
  member_id            TEXT    NOT NULL,
  response_id          TEXT    NOT NULL,
  status               TEXT    NOT NULL DEFAULT 'queued',
  suggested_tags_json  TEXT    NOT NULL DEFAULT '[]',
  reason               TEXT,
  created_at           TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at           TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_member_notes (
  note_id     TEXT PRIMARY KEY,
  member_id   TEXT NOT NULL,
  body        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  created_by  TEXT NOT NULL,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by  TEXT NOT NULL,
  note_type   TEXT NOT NULL DEFAULT 'general'  -- 0006 で追加 (general / visibility_request / delete_request)
);

CREATE INDEX IF NOT EXISTS idx_admin_notes_member
  ON admin_member_notes(member_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_admin_notes_member_type
  ON admin_member_notes(member_id, note_type, created_at);

CREATE TABLE IF NOT EXISTS deleted_members (
  member_id   TEXT PRIMARY KEY,
  deleted_by  TEXT NOT NULL,
  deleted_at  TEXT NOT NULL DEFAULT (datetime('now')),
  reason      TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_member_attendance_session
  ON member_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_member_tags_member
  ON member_tags(member_id);
CREATE INDEX IF NOT EXISTS idx_tag_queue_status
  ON tag_assignment_queue(status, created_at);
```

### 3.3 認証・監査（0003_auth_support.sql）

```sql
CREATE TABLE IF NOT EXISTS admin_users (
  admin_id      TEXT PRIMARY KEY,
  email         TEXT    NOT NULL UNIQUE,
  display_name  TEXT    NOT NULL,
  active        INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS magic_tokens (
  token        TEXT PRIMARY KEY,
  member_id    TEXT    NOT NULL,
  email        TEXT    NOT NULL,
  response_id  TEXT    NOT NULL,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  expires_at   TEXT    NOT NULL,
  used         INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS audit_log (
  audit_id     TEXT PRIMARY KEY,
  actor_id     TEXT,
  actor_email  TEXT,
  action       TEXT NOT NULL,
  target_type  TEXT NOT NULL,
  target_id    TEXT,
  before_json  TEXT,
  after_json   TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_magic_tokens_email
  ON magic_tokens(email, used);
CREATE INDEX IF NOT EXISTS idx_audit_log_target
  ON audit_log(target_type, target_id, created_at);
```

### 3.4 同期ジョブ運用（0002_sync_logs_locks.sql）

```sql
CREATE TABLE IF NOT EXISTS sync_locks (
  id              TEXT    PRIMARY KEY,
  acquired_at     TEXT    NOT NULL,
  expires_at      TEXT    NOT NULL,
  holder          TEXT    NOT NULL,
  trigger_type    TEXT    NOT NULL  -- cron / admin / backfill
);

CREATE TABLE IF NOT EXISTS sync_job_logs (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id            TEXT    NOT NULL UNIQUE,
  trigger_type      TEXT    NOT NULL,
  status            TEXT    NOT NULL,
  started_at        TEXT    NOT NULL,
  finished_at       TEXT,
  fetched_count     INTEGER NOT NULL DEFAULT 0,
  upserted_count    INTEGER NOT NULL DEFAULT 0,
  failed_count      INTEGER NOT NULL DEFAULT 0,
  retry_count       INTEGER NOT NULL DEFAULT 0,
  duration_ms       INTEGER,
  error_reason      TEXT
);

CREATE INDEX IF NOT EXISTS idx_sync_job_logs_started ON sync_job_logs(started_at);
CREATE INDEX IF NOT EXISTS idx_sync_job_logs_status  ON sync_job_logs(status, started_at);
```

### 3.5 view（0001_init.sql）

```sql
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
```

## 4. 制約・index サマリ（canonical 6）

| テーブル | PK | UNIQUE | NOT NULL 必須 | INDEX | CHECK |
| --- | --- | --- | --- | --- | --- |
| member_responses | response_id | - | response_id, form_id, revision_id, schema_hash, submitted_at, answers_json, raw_answers_json, extra_fields_json, unmapped_question_ids_json, search_text | (response_email, submitted_at) | - |
| member_identities | member_id | response_email | member_id, response_email, current_response_id, first_response_id, last_submitted_at, created_at, updated_at | - | - |
| member_status | member_id | - | public_consent, rules_consent, publish_state, is_deleted, updated_at | (public_consent, publish_state, is_deleted) | - |
| response_fields | (response_id, stable_key) | - | response_id, stable_key | (response_id) | - |
| schema_diff_queue | diff_id | partial: question_id WHERE status='queued' | revision_id, type, label, status, created_at | (status, created_at) | - |
| sync_jobs | job_id | - | job_type, started_at, status, metrics_json | - | - |

## 5. FK の取り扱い

- 0001〜0006 のいずれの migration も `FOREIGN KEY` 句を明示宣言していない。
- 親子関係（例: `response_fields.response_id` → `member_responses.response_id`）はアプリ層で整合維持する設計。
- `PRAGMA foreign_keys = ON;` の取り扱い方針は `migration-strategy.md` に記述。
- 将来 FK を追加する場合は、新規 migration（forward-only）に `PRAGMA foreign_keys = ON;` を冒頭に記述する規約とする。

## 6. DATETIME 統一仕様（ISO 8601 規約）

- 全 DATETIME 候補列は **TEXT 型** で宣言（既存 0001〜0006 全てに適用済）。
- 書き込み形式は次のいずれか:
  - 既定値: `DEFAULT (datetime('now'))` — SQLite 内部で `YYYY-MM-DD HH:MM:SS`（UTC）。
  - アプリ側生成: `new Date().toISOString()` — `YYYY-MM-DDTHH:MM:SS.sssZ`（UTC, ISO 8601 拡張形式）。
- ソート・比較は文字列比較で動作する（ISO 8601 は辞書順 = 時系列順を保証）。
- mixed format 注意: `datetime('now')` の出力（半角スペース区切り）と `Date.toISOString()`（`T` 区切り）は同じ文字列ソートで時系列順となる範囲が限定的。**新規書き込みはアプリ側 `Date.toISOString()` に統一**し、既存 DEFAULT 値は移行不要（過去ログの整合用途のみ）。
- 全テーブルで TZ は UTC 固定。表示時にアプリ層で JST 変換する。

## 7. 不変条件 touched

| # | 不変条件 | 設計内での扱い |
| --- | --- | --- |
| #1 | Forms schema をコードに固定しすぎない | `schema_questions.stable_key` を経由して列名を抽象化（DDL 内に Forms 列ラベルのハードコードゼロ） |
| #4 | admin-managed data は分離 | `member_status` / `meeting_sessions` / `admin_member_notes` 等の専用テーブル |
| #5 | D1 アクセスは `apps/api` に閉じる | 全 migration が `apps/api/migrations/` 配下。`apps/web` から schema 参照なし |

## 8. 想定容量と無料枠

| 指標 | 想定（MVP） | D1 無料枠 | 余裕 |
| --- | --- | --- | --- |
| 総行数 | 数千行（members 1000 / responses 5000 / fields 150000） | 5GB | 十分 |
| 月間 reads | 数万 | 25M | 十分 |
| 月間 writes | 数千 | 50K | 十分 |

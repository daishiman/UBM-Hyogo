# Cloudflare 無料構成と D1 テーブル設計

## 全体アーキテクチャ

```text
GitHub
  -> CI build
  -> deploy

Cloudflare Workers
  -> public / member / admin UI
  -> Auth.js
  -> sync jobs
  -> D1 access

Google Forms API
  -> forms.get
  -> forms.responses.list

Cloudflare D1
  -> normalized app state
```

GAS prototype はこの構成に含めない。`localStorage` ベースの UI 叩き台としてのみ扱う。

---

## 無料枠前提

| サービス | 想定用途 |
|---------|---------|
| Cloudflare Workers | UI / API / sync |
| Cloudflare D1 | 正規化データと運用データ |
| Google Forms API | schema / response 取得 |

50 人規模の MVP では無料枠内運用を前提にする。

---

## D1 設計方針

### 重要な見直し

従来案の `response_id` 中心設計だけでは、Google Form 再回答を正式更新手段にしたときに運用が崩れる。
そのため D1 は次の 2 層で持つ。

1. 回答層
   - `member_responses`
2. stable member 層
   - `member_identities`
   - `member_status`

この分離により、同じ `responseEmail` の複数回答を扱える。

---

## テーブル一覧

| テーブル | 役割 |
|----------|------|
| `form_manifests` | schema manifest |
| `form_fields` | field registry |
| `form_field_aliases` | `questionId` 差し替え追跡 |
| `member_responses` | 生回答の正規化保存 |
| `member_identities` | stable member entity |
| `member_status` | consent snapshot / 公開 / 削除状態 |
| `deleted_members` | 削除履歴 |
| `meeting_sessions` | 開催日 |
| `member_attendance` | 参加履歴 |
| `admin_users` | 管理者 |
| `magic_tokens` | Magic Link |
| `tag_definitions` | タグ辞書 |
| `member_tags` | 付与済みタグ |
| `tag_assignment_queue` | 手動確認キュー |
| `sync_jobs` | 同期実行履歴 |

`profile_overrides` は本人更新の正本から外すため、MVP 必須テーブルに含めない。

---

## 主要テーブル

### member_responses

```sql
CREATE TABLE IF NOT EXISTS member_responses (
  response_id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL,
  revision_id TEXT NOT NULL,
  schema_hash TEXT NOT NULL,
  response_email TEXT,
  submitted_at TEXT NOT NULL,
  edit_response_url TEXT,
  answers_json TEXT NOT NULL,
  raw_answers_json TEXT NOT NULL DEFAULT '{}',
  extra_fields_json TEXT NOT NULL DEFAULT '{}',
  unmapped_question_ids_json TEXT NOT NULL DEFAULT '[]',
  search_text TEXT NOT NULL DEFAULT ''
);
```

### member_identities

```sql
CREATE TABLE IF NOT EXISTS member_identities (
  member_id TEXT PRIMARY KEY,
  response_email TEXT NOT NULL UNIQUE,
  current_response_id TEXT NOT NULL,
  first_response_id TEXT NOT NULL,
  last_submitted_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### member_status

```sql
CREATE TABLE IF NOT EXISTS member_status (
  member_id TEXT PRIMARY KEY,
  public_consent TEXT NOT NULL DEFAULT 'unknown',
  rules_consent TEXT NOT NULL DEFAULT 'unknown',
  publish_state TEXT NOT NULL DEFAULT 'member_only',
  is_deleted INTEGER NOT NULL DEFAULT 0,
  hidden_reason TEXT,
  last_notified_at TEXT,
  updated_by TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### deleted_members

```sql
CREATE TABLE IF NOT EXISTS deleted_members (
  member_id TEXT PRIMARY KEY,
  deleted_by TEXT NOT NULL,
  deleted_at TEXT NOT NULL DEFAULT (datetime('now')),
  reason TEXT NOT NULL DEFAULT ''
);
```

---

## admin-managed data

### meeting_sessions

```sql
CREATE TABLE IF NOT EXISTS meeting_sessions (
  session_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  held_on TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL
);
```

### member_attendance

```sql
CREATE TABLE IF NOT EXISTS member_attendance (
  member_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
  assigned_by TEXT NOT NULL,
  PRIMARY KEY (member_id, session_id)
);
```

### tag_assignment_queue

```sql
CREATE TABLE IF NOT EXISTS tag_assignment_queue (
  queue_id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  response_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  suggested_tags_json TEXT NOT NULL DEFAULT '[]',
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

---

## 認証補助

```sql
CREATE TABLE IF NOT EXISTS magic_tokens (
  token TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  email TEXT NOT NULL,
  response_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);
```

`responseEmail` を直接トークン照合に使いつつ、最終的な権限制御は `member_id` に寄せる。

---

## 保存ルール

1. `responseEmail` は `member_responses.response_email` と `member_identities.response_email` に保存する
2. `current_response_id` の更新で最新回答を切り替える
3. consent は current response から `member_status` へ反映する
4. 参加履歴・タグ・公開状態は form schema 外テーブルで管理する
5. 削除しても raw response は監査目的で保持する

---

## セットアップ時の注意

1. `GOOGLE_FORM_ID` は `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg` を使う
2. schema sync と response sync の cron を分ける
3. 本人更新機能のために `profile_overrides` を追加しない
4. GAS prototype の保存方式を D1 設計へ持ち込まない

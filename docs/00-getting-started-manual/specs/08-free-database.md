# Cloudflare 無料構成と D1 テーブル設計

## 全体アーキテクチャ

```text
GitHub
  -> CI build (GitHub Actions)
  -> deploy to Cloudflare (via CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID)

Cloudflare Workers (apps/web via @opennextjs/cloudflare)
  -> public / member / admin UI (Next.js App Router)
  -> Auth.js

Cloudflare Workers (apps/api)
  -> API エンドポイント (Hono)
  -> sync jobs (schema sync / response sync)
  -> D1 access (D1 binding 経由、apps/web から直接アクセスしない)

Google Forms API
  -> forms.get
  -> forms.responses.list

Cloudflare D1
  -> normalized app state (canonical DB)
```

GAS prototype はこの構成に含めない。`localStorage` ベースの UI 叩き台としてのみ扱う。

---

## 無料枠前提

| サービス | 想定用途 | 無料枠 |
|---------|---------|--------|
| Cloudflare Workers | Web UI ホスティング (apps/web via @opennextjs/cloudflare) | 100k req/day |
| Cloudflare Workers | API / sync ジョブ (apps/api) | 100k req/day |
| Cloudflare D1 | 正規化データと運用データ | 5GB / 500k reads/day |
| Google Forms API | schema / response 取得 | 無料 |

50 人規模の MVP では無料枠内運用を前提にする。

---

## ブランチ/デプロイ構成

| ブランチ | Web Worker 環境 | API Worker 環境 |
|---------|----------------------|------------------------|
| `dev` | staging プロジェクト (`ubm-hyogo-web-staging`) | staging Worker (`ubm-hyogo-api-staging`) |
| `main` | production プロジェクト (`ubm-hyogo-web`) | production Worker (`ubm-hyogo-api`) |

GitHub Actions が `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` でデプロイを実行する。

### 設定ファイルの配置

| ファイル | サービス | build output |
|---------|---------|-------------|
| `apps/web/wrangler.toml` | Cloudflare Workers (Next.js via @opennextjs/cloudflare) | `.open-next/worker.js` |
| `apps/api/wrangler.toml` | Cloudflare Workers (API) | `src/index.ts` |

Web Worker は `wrangler deploy --config apps/web/wrangler.toml` で作成・更新する。
CI/CD パイプラインは `apps/web/wrangler.toml` の `name` を参照する。

---

## シークレット配置

本番・staging 環境で必要なシークレットは Cloudflare Secrets に登録する。ローカル開発では 1Password Environments から取得する。

| シークレット名 | Cloudflare Secrets | GitHub Secrets | 1Password |
|--------------|:-----------------:|:--------------:|:---------:|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | ✅ | - | ✅ (正本) |
| `GOOGLE_PRIVATE_KEY` | ✅ | - | ✅ (正本) |
| `GOOGLE_FORM_ID` | ✅ | - | ✅ (正本) |
| `AUTH_SECRET` | ✅ | - | ✅ (正本) |
| `AUTH_GOOGLE_ID` | ✅ | - | ✅ (正本) |
| `AUTH_GOOGLE_SECRET` | ✅ | - | ✅ (正本) |
| `RESEND_API_KEY` | ✅ | - | ✅ (正本) |
| `CLOUDFLARE_API_TOKEN` | - | ✅ | ✅ (正本) |
| `CLOUDFLARE_ACCOUNT_ID` | - | ✅ | ✅ (正本) |

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
| `admin_member_notes` | 管理メモ |
| `audit_log` | 管理操作監査ログ（append-only） |
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

### admin_member_notes

```sql
CREATE TABLE IF NOT EXISTS admin_member_notes (
  note_id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT NOT NULL
);
```

管理メモは admin-managed data であり、Google Form 回答や公開プロフィール本文へは反映しない。
`/admin/members` の右ドロワーだけで表示・編集する。

### audit_log

```sql
CREATE TABLE IF NOT EXISTS audit_log (
  audit_id TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  metadata TEXT NOT NULL DEFAULT '{}',
  occurred_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

監査ログは append-only とし、UPDATE / DELETE API を持たない。`metadata` には本文や secret を保存せず、対象ID、操作種別、差分の要約だけを保存する。

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
4. 参加履歴・タグ・公開状態・管理メモは form schema 外テーブルで管理する
5. 削除しても raw response は監査目的で保持する

---

## index / 整合ルール

D1 では外部キー制約に依存しすぎず、repository 層で存在確認を行う。
migration では検索・結合に必要な index を必ず作る。

```sql
CREATE INDEX IF NOT EXISTS idx_member_responses_email_submitted
  ON member_responses(response_email, submitted_at);

CREATE INDEX IF NOT EXISTS idx_member_status_public
  ON member_status(public_consent, publish_state, is_deleted);

CREATE INDEX IF NOT EXISTS idx_member_attendance_session
  ON member_attendance(session_id);

CREATE INDEX IF NOT EXISTS idx_member_tags_member
  ON member_tags(member_id);

CREATE INDEX IF NOT EXISTS idx_tag_queue_status
  ON tag_assignment_queue(status, created_at);

CREATE INDEX IF NOT EXISTS idx_admin_notes_member
  ON admin_member_notes(member_id, updated_at);
```

整合ルール:

1. `member_identities.current_response_id` は `member_responses.response_id` に存在すること
2. `member_status.member_id` は `member_identities.member_id` に存在すること
3. `member_attendance` は同じ `(member_id, session_id)` を重複登録しない
4. 削除済み会員は新規 attendance 追加候補から除外する
5. `tag_assignment_queue.status=resolved` の queue は再解決しない

---

## セットアップ時の注意

1. `GOOGLE_FORM_ID` は `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg` を使う
2. schema sync と response sync の cron を分ける
3. 本人更新機能のために `profile_overrides` を追加しない
4. GAS prototype の保存方式を D1 設計へ持ち込まない

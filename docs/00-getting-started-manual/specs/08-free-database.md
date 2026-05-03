# Cloudflare 無料構成と D1 テーブル設計

## 全体アーキテクチャ

```text
GitHub
  -> CI build (GitHub Actions)
  -> deploy to Cloudflare (via CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID)

Cloudflare Pages (apps/web)
  -> public / member / admin UI (Next.js App Router)
  -> Auth.js

Cloudflare Workers (apps/api)
  -> API エンドポイント (Hono)
  -> sync jobs (schema sync / response sync)
  -> D1 access (D1 binding 経由、Pages から直接アクセスしない)

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
| Cloudflare Pages | Web UI ホスティング (apps/web) | 無料枠あり |
| Cloudflare Workers | API / sync ジョブ (apps/api) | 100k req/day |
| Cloudflare D1 | 正規化データと運用データ | 5GB / 500k reads/day |
| Google Forms API | schema / response 取得 | 無料 |

50 人規模の MVP では無料枠内運用を前提にする。

---

## ブランチ/デプロイ構成

| ブランチ | Cloudflare Pages 環境 | Cloudflare Workers 環境 |
|---------|----------------------|------------------------|
| `dev` | staging プロジェクト (`ubm-hyogo-web-staging`) | staging Worker (`ubm-hyogo-api-staging`) |
| `main` | production プロジェクト (`ubm-hyogo-web`) | production Worker (`ubm-hyogo-api`) |

GitHub Actions が `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` でデプロイを実行する。

### 設定ファイルの配置

| ファイル | サービス | build output |
|---------|---------|-------------|
| `apps/web/wrangler.toml` | Cloudflare Pages (フロントエンド) | `.next` |
| `apps/api/wrangler.toml` | Cloudflare Workers (API) | `src/index.ts` |

TypeScript 側の API Worker Env 型は `apps/api/src/env.ts` の `Env` interface を正本とする。D1 binding `DB`、非機密 vars、Cloudflare Secrets を追加・変更する場合は、`apps/api/wrangler.toml` と `apps/api/src/env.ts` を同じ変更単位で同期する。

Pages の初回プロジェクト作成は Cloudflare Dashboard → Connect to Git で行う。
CI/CD パイプライン (`wrangler pages deploy`) からは `apps/web/wrangler.toml` の `name` を参照する。

---

## シークレット配置

本番・staging 環境で必要なシークレットは Cloudflare Secrets に登録する。ローカル開発では 1Password Environments から取得する。

| 名前 | 種別 | Cloudflare | GitHub | 1Password |
|--------------|------|:----------:|:------:|:---------:|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Secret | Secrets | - | ✅ (正本) |
| `GOOGLE_PRIVATE_KEY` | Secret | Secrets | - | ✅ (正本) |
| `GOOGLE_FORM_ID` | Secret | Secrets | - | ✅ (正本) |
| `AUTH_SECRET` | Secret | Secrets | - | ✅ (正本) |
| `AUTH_GOOGLE_ID` | Secret | Secrets | - | ✅ (正本) |
| `AUTH_GOOGLE_SECRET` | Secret | Secrets | - | ✅ (正本) |
| `MAIL_PROVIDER_KEY` | Secret | Secrets | - | ✅ (正本) |
| `MAIL_FROM_ADDRESS` | Variable | Variables | - | 任意（runtime smoke では必須） |
| `AUTH_URL` | Variable | Variables | - | 任意（runtime smoke では必須） |
| `CLOUDFLARE_API_TOKEN` | Secret | - | Secrets | ✅ (正本) |
| `CLOUDFLARE_ACCOUNT_ID` | Variable | - | Variables | ✅ (正本) |

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
| `admin_member_notes` | 管理メモ / member self-service 申請 queue |
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

`MemberProfile.attendance` の read path は `member_attendance.member_id IN (...)` を使う。D1 / SQLite bind 上限を避けるため、実装は 80 memberId ごとに chunk 分割し、`meeting_sessions.session_id` へ INNER JOIN して `held_on DESC`, `session_id ASC` で安定化する。`meeting_sessions` に存在しない session は返さない。

### admin_member_notes

```sql
CREATE TABLE IF NOT EXISTS admin_member_notes (
  note_id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  body TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'general',
  request_status TEXT,
  resolved_at INTEGER,
  resolved_by_admin_id TEXT,
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_admin_notes_member_type
  ON admin_member_notes (member_id, note_type, created_at);

CREATE INDEX IF NOT EXISTS idx_admin_notes_pending_requests
  ON admin_member_notes (member_id, note_type)
  WHERE request_status = 'pending';
```

`note_type='general'` は通常の管理メモで、request 系 3 列を NULL に保つ。
`visibility_request` / `delete_request` は申請 queue として作成時に
`request_status='pending'` を設定する。resolve/reject は
`WHERE request_status='pending'` の条件付き UPDATE で処理済み行の再更新を防ぐ。

### tag_assignment_queue

```sql
CREATE TABLE IF NOT EXISTS tag_assignment_queue (
  queue_id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  response_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  suggested_tags_json TEXT NOT NULL DEFAULT '[]',
  reason TEXT,
  idempotency_key TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  next_visible_at TEXT,
  dlq_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tag_queue_idempotency
  ON tag_assignment_queue(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tag_queue_visible
  ON tag_assignment_queue(status, next_visible_at);

CREATE INDEX IF NOT EXISTS idx_tag_queue_dlq
  ON tag_assignment_queue(status, dlq_at);
```

`status` は `queued | reviewing | resolved | rejected | dlq` を扱う。仕様語では `queued` が `candidate`、`resolved` が `confirmed`、`dlq` が retry 上限超過の保留棚に対応する。`idempotency_key` は現行 candidate row では `<memberId>:<responseId>` で生成する。tagCode は admin 確定時に初めて決まるため key に含めない。`member_tags` への確定書き込みは `POST /admin/tags/queue/:queueId/resolve` の guarded update 成功後だけ行う。

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
6. 公開停止 / 退会申請は `admin_member_notes` に queue 化し、`member_responses` / `response_fields` は直接更新しない

## schema alias back-fill（07b）

未解決 question は `schema_diff_queue.status='queued'` として入り、07b apply で `resolved` へ進む。実 DB には `response_fields.questionId` / `response_fields.is_deleted` はないため、extra field は `stable_key='__extra__:<questionId>'` で識別し、削除済み member は `member_identities` と `deleted_members` の join で back-fill 対象から外す。

`schema_questions(revision_id, stable_key)` の物理 UNIQUE index は未導入で、現状は workflow pre-check で 422 を返す。物理制約、10,000 行級実測、retryable HTTP contract は `UT-07B-schema-alias-hardening-001` に分離する。

### production migration apply の運用境界

UT-07B の `apps/api/migrations/0008_schema_alias_hardening.sql` を本番 D1 (`ubm-hyogo-db-prod`) に適用する手順は **承認ゲート付き runbook** として `docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/phase-05/main.md` に分離している。production への実 apply は本仕様書（spec 層）で扱わず、必ず runbook 8 セクション（Overview / 承認ゲート / Preflight / Apply / Post-check / Evidence / Failure handling / Smoke 制限）に従い、`bash scripts/cf.sh` 経由でのみ実施する。

---

## 関連タスク仕様書

- UT-04 D1 データスキーマ設計（`docs/30-workflows/ut-04-d1-schema-design/`）— 本書の D1 テーブル群（`member_responses` / `member_identities` / `member_status` / `sync_jobs` ほか）の正本スキーマ設計タスク。

---

## セットアップ時の注意

1. `GOOGLE_FORM_ID` は `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg` を使う
2. schema sync と response sync の cron を分ける
3. 本人更新機能のために `profile_overrides` を追加しない
4. GAS prototype の保存方式を D1 設計へ持ち込まない

---

## D1 `sessions` テーブル不採用（05a 確定）

Auth.js v5 を採用しても **D1 に `sessions` テーブルを作らず、JWT-only session** とする。
詳細は `13-mvp-auth.md` § "MVP session JWT 構造" を参照。

### 不採用の根拠

| 観点 | JWT-only（採用） | D1 sessions（不採用） |
|------|----------------|---------------------|
| D1 read コスト | 0（毎リクエスト JWT verify のみ） | session lookup ごとに 1 read |
| 無料枠（500k reads/day）影響 | なし | admin 操作・API 呼び出しごとに reads を消費 |
| 50 人規模 MVP 想定 req/day | 余裕 | 上限到達リスクあり |
| admin 剥奪の即時反映 | できない（24h TTL） | できる |
| 失効管理の複雑性 | 低 | DB 整合性の維持コスト |

### 制約として受け入れる事項

1. `admin_users.active = 0` への変更は **次回ログイン or JWT 自然失効まで反映されない**（13-mvp-auth.md B-01）
2. 緊急失効が必要なときは `AUTH_SECRET` rotate（全 session 一括 invalidate）
3. 将来 revocation list が必要になった場合は **KV 側に置く**（D1 sessions テーブルは復活させない）

### 関連実装

- `packages/shared/src/auth.ts`: `signSessionJwt` / `verifySessionJwt` / `SESSION_JWT_TTL_SECONDS`
- `apps/web/src/lib/auth.ts`: Auth.js cookie session = HS256 JWT
- `apps/api/src/middleware/require-admin.ts`: cookie / Authorization から JWT 抽出 → verify

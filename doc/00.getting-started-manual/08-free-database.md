# Cloudflare無料構成 セットアップガイド

## 全体アーキテクチャ

```text
GitHub
  -> CI build
  -> deploy

Cloudflare Workers (Next.js 16.2.3 + OpenNext)
  -> UI / Route Handlers / Server Actions
  -> Auth.js
  -> Cron sync
  -> D1 access

Google Forms API
  -> forms.get
  -> forms.responses.list

Cloudflare D1
  -> app state
```

本番ターゲットは **Cloudflare Workers** です。
full-stack SSR、Route Handlers、Auth.js、Cron 同期まで含めるなら Workers + OpenNext に統一する。

---

## 無料枠

| サービス | 無料上限 | 50人規模での見通し |
|---------|---------|-----------------|
| Cloudflare Workers | 100K req/日 | 全量無料 |
| Cloudflare D1 | 読み5M行/日・書き100K行/日・5GB | 全量無料 |
| Google Forms API | 小規模運用なら無料枠内 | 全量無料 |

---

## セットアップ手順

### 前提条件

- GitHub アカウント
- Cloudflare アカウント
- Node.js 20 以上
- pnpm インストール済み

---

### Step 1: プロジェクト作成

```bash
pnpm create cloudflare@latest ubm-members -- --framework=next --platform=workers
cd ubm-members
pnpm install
```

---

### Step 2: 必要パッケージの追加

```bash
pnpm add next@16.2.3 react@19.2.5 react-dom@19.2.5
pnpm add googleapis@171.4.0 next-auth@5.0.0-beta.30 resend@6.10.0 zod@4.3.6 react-hook-form@7.72.1 @hookform/resolvers@5.2.2
pnpm add lucide-react@1.8.0 sonner@2.0.7 clsx@2.1.1 tailwind-merge@3.5.0 cmdk@1.1.1
pnpm add @opennextjs/cloudflare@1.18.1
pnpm add -D wrangler@4.81.0 tailwindcss@4.2.2 @tailwindcss/postcss@4.2.2 @tailwindcss/typography@0.5.19
```

UI 層で shadcn を使う場合:

```bash
pnpm dlx shadcn@4.2.0 init
```

---

### Step 3: D1 作成

```bash
pnpm wrangler login
pnpm wrangler d1 create ubm-members-db
```

---

### Step 4: `wrangler.jsonc` の設定

Cloudflare の現行構成では `wrangler.jsonc` を推奨する。

```json
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "ubm-members",
  "main": ".open-next/worker.js",
  "compatibility_date": "2026-04-09",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "ubm-members-db",
      "database_id": "REPLACE_WITH_D1_ID"
    }
  ],
  "triggers": {
    "crons": [
      "*/15 * * * *",
      "7 4 * * *"
    ]
  }
}
```

想定 cron:

- 15分ごと: response sync
- 毎日 04:07 JST 相当: schema sync

---

### Step 5: OpenNext 設定

`open-next.config.ts`

```ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();
```

`package.json` scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "opennextjs-cloudflare build",
    "preview": "opennextjs-cloudflare preview",
    "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
    "cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts"
  }
}
```

---

### Step 6: D1 テーブル作成

`migrations/0001_init.sql`

```sql
CREATE TABLE IF NOT EXISTS form_manifests (
  form_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  schema_hash TEXT NOT NULL,
  source_revision TEXT,
  synced_at TEXT NOT NULL,
  source_updated_at TEXT
);

CREATE TABLE IF NOT EXISTS form_fields (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  form_id TEXT NOT NULL,
  stable_key TEXT NOT NULL,
  question_id TEXT,
  item_id TEXT,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL,
  section_key TEXT NOT NULL,
  position INTEGER NOT NULL,
  required INTEGER NOT NULL DEFAULT 0,
  editable_by_member INTEGER NOT NULL DEFAULT 0,
  editable_by_admin INTEGER NOT NULL DEFAULT 0,
  visibility TEXT NOT NULL DEFAULT 'public',
  status TEXT NOT NULL DEFAULT 'active',
  options_json TEXT NOT NULL DEFAULT '[]',
  UNIQUE(form_id, stable_key)
);

CREATE TABLE IF NOT EXISTS form_field_aliases (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  form_id TEXT NOT NULL,
  stable_key TEXT NOT NULL,
  old_question_id TEXT NOT NULL,
  new_question_id TEXT NOT NULL,
  detected_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS member_responses (
  response_id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL,
  email TEXT,
  submitted_at TEXT NOT NULL,
  schema_hash TEXT NOT NULL,
  answers_json TEXT NOT NULL,
  raw_answers_json TEXT NOT NULL DEFAULT '{}',
  extra_fields_json TEXT NOT NULL DEFAULT '{}',
  search_text TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS profile_overrides (
  response_id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  schema_hash TEXT NOT NULL,
  values_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT
);

CREATE TABLE IF NOT EXISTS deleted_members (
  response_id TEXT PRIMARY KEY,
  deleted_by TEXT NOT NULL,
  deleted_at TEXT NOT NULL DEFAULT (datetime('now')),
  reason TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS member_status (
  response_id TEXT PRIMARY KEY,
  public_consent TEXT NOT NULL DEFAULT 'unknown',
  rules_consent TEXT NOT NULL DEFAULT 'unknown',
  is_public INTEGER NOT NULL DEFAULT 0,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  hidden_reason TEXT,
  last_notified_at TEXT,
  updated_by TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_users (
  email TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS magic_tokens (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tag_definitions (
  tag_id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  source_fields TEXT NOT NULL DEFAULT '[]',
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS tag_rules (
  rule_id TEXT PRIMARY KEY,
  tag_id TEXT NOT NULL,
  schema_hash TEXT,
  source_stable_keys TEXT NOT NULL DEFAULT '[]',
  match_type TEXT NOT NULL,
  match_value TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS member_tags (
  response_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  source_schema_hash TEXT NOT NULL,
  matched_by TEXT NOT NULL,
  confidence REAL NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (response_id, tag_id)
);

CREATE TABLE IF NOT EXISTS sync_jobs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  job_type TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  finished_at TEXT,
  details_json TEXT NOT NULL DEFAULT '{}'
);
```

実行:

```bash
pnpm wrangler d1 execute ubm-members-db --file=migrations/0001_init.sql
```

---

### Step 7: 管理者を追加

```bash
pnpm wrangler d1 execute ubm-members-db \
  --command="INSERT INTO admin_users (email) VALUES ('your-gmail@gmail.com')"
```

---

### Step 8: 環境変数の設定

Cloudflare Dashboard → Workers & Pages → 対象 Worker → Settings → Variables に追加する。

| 変数名 | 値 |
|--------|-----|
| `AUTH_SECRET` | セッション暗号化キー |
| `AUTH_GOOGLE_ID` | Google OAuth client id |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Forms 読み取り用サービスアカウント |
| `GOOGLE_PRIVATE_KEY` | サービスアカウント秘密鍵 |
| `GOOGLE_FORM_ID` | 対象 form id |
| `RESEND_API_KEY` | Resend key |
| `RESEND_FROM_EMAIL` | 送信元 |
| `SITE_URL` | 例: `https://your-site.example.com` |

---

## デプロイの流れ

```text
git push
  -> CI build
  -> opennextjs-cloudflare build
  -> deploy to Workers
```

---

## よく使うコマンド

```bash
pnpm dev
pnpm run build
pnpm run preview
pnpm run deploy

pnpm wrangler d1 execute ubm-members-db --command="SELECT * FROM admin_users"
pnpm wrangler d1 execute ubm-members-db --local --command="SELECT * FROM member_status"
```

---

## コスト

月次コスト試算（50名・月1,000PV・低頻度同期）:

| サービス | 使用量 | 費用 |
|---------|--------|------|
| Cloudflare Workers | Free plan 範囲 | JPY 0 |
| Cloudflare D1 | Free plan 範囲 | JPY 0 |
| Google Forms API | 少量運用 | JPY 0 |
| **合計** | | **JPY 0** |

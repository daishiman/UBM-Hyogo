# Cloudflare / D1 / CI 構築ランブック

## 目的

プロトタイプを本番へ反映できるように、Cloudflare Workers、D1、Secrets、GitHub Actions の構築手順を定義する。

対象環境は staging と production の 2 系統。`dev` ブランチを staging、`main` ブランチを production に対応させる。

---

## 環境一覧

| 用途 | branch | Web Worker | API Worker | D1 |
|------|--------|-------|--------|----|
| staging | `dev` | `ubm-hyogo-web-staging` | `ubm-hyogo-api-staging` | `ubm_hyogo_staging` |
| production | `main` | `ubm-hyogo-web` | `ubm-hyogo-api` | `ubm_hyogo_production` |

---

## Cloudflare 初期構築

### 1. D1 database 作成

```bash
wrangler d1 create ubm_hyogo_staging
wrangler d1 create ubm_hyogo_production
```

作成後、`database_id` を `apps/api/wrangler.toml` の環境別 binding に設定する。

### 2. Workers API 作成

`apps/api/wrangler.toml`:

```toml
name = "ubm-hyogo-api-staging"
main = "src/index.ts"
compatibility_date = "2026-04-26"

[[d1_databases]]
binding = "DB"
database_name = "ubm_hyogo_staging"
database_id = "<staging_database_id>"

[env.production]
name = "ubm-hyogo-api"

[[env.production.d1_databases]]
binding = "DB"
database_name = "ubm_hyogo_production"
database_id = "<production_database_id>"
```

### 3. Web Worker 作成

`apps/web/wrangler.toml`:

```toml
name = "ubm-hyogo-web-staging"
main = ".open-next/worker.js"
compatibility_date = "2026-04-26"

[vars]
NEXT_PUBLIC_API_BASE_URL = "https://ubm-hyogo-api-staging.<account>.workers.dev"

[env.production.vars]
NEXT_PUBLIC_API_BASE_URL = "https://ubm-hyogo-api.<account>.workers.dev"
```

Next.js on Cloudflare は `@opennextjs/cloudflare` を採用する。
そのため build output は `.open-next/` に固定し、`08-free-database.md` の構成表と一致させる。
adapter を変更する場合は、`apps/web/wrangler.toml`、GitHub Actions、`08-free-database.md`、本ランブックを同一 PR で更新する。

---

## Secrets

Cloudflare Secrets は API Worker と Web Worker の両方に登録する。Google Forms 同期や mail 送信は API Worker、Auth.js session 生成は Web Worker 側が使う。

API Worker:

```bash
wrangler secret put GOOGLE_SERVICE_ACCOUNT_EMAIL --config apps/api/wrangler.toml
wrangler secret put GOOGLE_PRIVATE_KEY --config apps/api/wrangler.toml
wrangler secret put GOOGLE_FORM_ID --config apps/api/wrangler.toml
wrangler secret put RESEND_API_KEY --config apps/api/wrangler.toml
wrangler secret put RESEND_FROM_EMAIL --config apps/api/wrangler.toml
```

Web Worker:

```bash
wrangler secret put AUTH_SECRET --config apps/web/wrangler.toml
wrangler secret put AUTH_GOOGLE_ID --config apps/web/wrangler.toml
wrangler secret put AUTH_GOOGLE_SECRET --config apps/web/wrangler.toml
```

production は `apps/web/wrangler.toml` の production env に登録する。

```bash
wrangler secret put GOOGLE_FORM_ID --env production --config apps/api/wrangler.toml
wrangler secret put AUTH_SECRET --env production --config apps/web/wrangler.toml
```

GitHub Secrets に登録する。

| secret | 用途 |
|--------|------|
| `CLOUDFLARE_API_TOKEN` | deploy |
| `CLOUDFLARE_ACCOUNT_ID` | deploy |

GitHub Variables に登録する。

| variable | staging | production |
|----------|---------|------------|
| `API_BASE_URL` | staging Worker URL | production Worker URL |
| `SITE_URL` | staging Pages URL | production Pages URL |

---

## D1 migration

migration は `apps/api/migrations` に置く。

```bash
wrangler d1 migrations create ubm_hyogo_staging init_schema --config apps/api/wrangler.toml
wrangler d1 migrations apply ubm_hyogo_staging --local --config apps/api/wrangler.toml
wrangler d1 migrations apply ubm_hyogo_staging --remote --config apps/api/wrangler.toml
wrangler d1 migrations apply ubm_hyogo_production --remote --env production --config apps/api/wrangler.toml
```

ルール:

- migration は後方互換を優先する
- production へ直接 ad hoc SQL を流さない
- seed は staging/local のみに限定する
- production seed は `admin_users` 初期登録など最小限にする

---

## GitHub Actions

### CI

PR と push で実行する。

```yaml
name: ci
on:
  pull_request:
  push:
    branches: [dev, main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
```

### deploy staging

`dev` push で実行する。

```yaml
name: deploy-staging
on:
  push:
    branches: [dev]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
      - run: pnpm --filter @ubm/api db:migrate:staging
      - run: pnpm --filter @ubm/api deploy:staging
      - run: pnpm --filter @ubm/web deploy:staging
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### deploy production

`main` push で実行する。D1 migration は deploy 前に実行する。

```yaml
name: deploy-production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm --filter @ubm/api db:migrate:production
      - run: pnpm --filter @ubm/api deploy:production
      - run: pnpm --filter @ubm/web deploy:production
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

---

## Cron / sync

Workers Cron Triggers を API Worker に設定する。

```toml
[triggers]
crons = ["*/15 * * * *", "0 3 * * *"]
```

運用:

- 15 分ごとに response sync
- 1 日 1 回 schema sync
- 管理画面の `今すぐ同期` は admin API で手動実行する
- sync result は `sync_jobs` に保存する
- sync 実行前に `sync_jobs` の `running` レコードを確認し、同種 job が実行中なら新規実行しない
- 失敗時は `failed` と error message を保存し、次回 cron で再試行する
- 部分失敗時も直近成功済みの view model を返し、管理画面に `sync_unavailable` 警告を出す

---

## CORS / URL 設定

API Worker は Pages の staging / production origin だけを許可する。

| 環境 | allowed origin | API base |
|------|----------------|----------|
| staging | `https://ubm-hyogo-web-staging.pages.dev` | `https://ubm-hyogo-api-staging.<account>.workers.dev` |
| production | `https://ubm-hyogo-web.pages.dev` または独自ドメイン | `https://ubm-hyogo-api.<account>.workers.dev` |

Web 側は `NEXT_PUBLIC_API_BASE_URL + route` で Worker を呼ぶ。
Worker route は `/public/*`, `/me/*`, `/admin/*`, `/auth/*` に統一し、Next.js 側の `/api/*` route を正本にしない。

Auth.js callback URL は環境ごとに Pages の URL を登録する。

---

## ローカル開発

```bash
pnpm install
pnpm --filter @ubm/api db:migrate:local
pnpm --filter @ubm/api dev
pnpm --filter @ubm/web dev
```

ローカルでは Cloudflare D1 local DB を使う。Google Forms API を使わない画面検証では、`packages/shared` の fixture を seed として投入する。
Pages から D1 へ直接接続せず、常に `NEXT_PUBLIC_API_BASE_URL` 経由で `apps/api` を呼ぶ。

---

## リリース前チェック

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test`
4. `pnpm build`
5. D1 migration dry-run
6. staging deploy
7. staging で Forms sync
8. staging で `/`, `/members`, `/login`, `/profile`, `/admin` を確認
9. production secrets 登録確認
10. production deploy

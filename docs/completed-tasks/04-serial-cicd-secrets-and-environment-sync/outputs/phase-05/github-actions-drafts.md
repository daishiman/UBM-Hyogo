# Phase 5 成果物: GitHub Actions ワークフロー草案

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | cicd-secrets-and-environment-sync |
| Phase 番号 | 5 / 13 |
| 作成日 | 2026-04-26 |
| 状態 | draft (実装用参照ドキュメント) |

> **注意**: このファイルはワークフローの草案であり、実際の `.github/workflows/` に配置する実装ファイルではありません。
> 実装時はこの草案をベースに wrangler.toml の `name` 値等を確認してから適用してください。

---

## 1. ci.yml 草案 — lint / typecheck / build

### 目的

- `feature/*`, `dev`, `main` への push および PR 時に品質チェックを実行する
- デプロイとは分離し、純粋な CI チェックのみを担当する

### 注意事項

- deploy secret (`CLOUDFLARE_API_TOKEN`) はこのワークフローでは使用しない
- `apps/web` と `apps/api` の両方をチェックする
- pnpm workspace なので `--filter` を使ってパッケージを指定する

### YAML 草案

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches:
      - "feature/**"
      - dev
      - main
  pull_request:
    branches:
      - dev
      - main

jobs:
  lint-typecheck:
    name: Lint & Typecheck
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: "10"

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "24"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint (web)
        run: pnpm --filter @ubm-hyogo/web lint

      - name: Lint (api)
        run: pnpm --filter @ubm-hyogo/api lint

      - name: Typecheck (web)
        run: pnpm --filter @ubm-hyogo/web typecheck

      - name: Typecheck (api)
        run: pnpm --filter @ubm-hyogo/api typecheck

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: lint-typecheck
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: "10"

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "24"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build (web)
        run: pnpm --filter @ubm-hyogo/web build

      - name: Build (api)
        run: pnpm --filter @ubm-hyogo/api build
```

---

## 2. web-cd.yml 草案 — apps/web のデプロイ

### 目的

- `apps/web` (Next.js via `@opennextjs/cloudflare`) を Cloudflare Workers にデプロイする
- `dev` ブランチ → staging Worker, `main` ブランチ → production Worker
- CI (ci.yml) の成功後にのみ実行する

### 注意事項

- deploy secret (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) のみを使用する
- runtime secret (`GOOGLE_CLIENT_SECRET`) はこのワークフローで設定しない (Cloudflare Secrets に直接登録済み)
- `feature/*` ブランチではトリガーしない (CI のみ)
- `environment:` キーワードで GitHub Environment を指定し、保護ルールを適用する

### YAML 草案

```yaml
# .github/workflows/web-cd.yml
name: Web CD

on:
  push:
    branches:
      - dev
      - main
    paths:
      - "apps/web/**"
      - "packages/**"
      - "pnpm-lock.yaml"

jobs:
  deploy-staging:
    name: Deploy Web (Staging)
    if: github.ref == 'refs/heads/dev'
    runs-on: ubuntu-latest
    environment: dev
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: "10"

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "24"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build (web)
        run: pnpm --filter @ubm-hyogo/web build

      - name: Deploy to Cloudflare Workers (staging)
        run: pnpm --filter @ubm-hyogo/web deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
          # runtime secret は Cloudflare Secrets に登録済みのためここでは指定しない

  deploy-production:
    name: Deploy Web (Production)
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: main
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: "10"

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "24"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build (web)
        run: pnpm --filter @ubm-hyogo/web build

      - name: Deploy to Cloudflare Workers (production)
        run: pnpm --filter @ubm-hyogo/web deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
```

---

## 3. backend-deploy.yml 草案 — apps/api のデプロイ

### 目的

- `apps/api` (Hono on Cloudflare Workers) を Cloudflare Workers にデプロイする
- `dev` ブランチ → staging API Worker, `main` ブランチ → production API Worker
- web-cd.yml とは独立したデプロイパスを持つ

### 注意事項

- `apps/api` の変更があった場合のみトリガーする (`paths` フィルタ)
- runtime secret (`GOOGLE_CLIENT_SECRET`, `GOOGLE_SERVICE_ACCOUNT_JSON`) はワークフローで扱わない
- D1 マイグレーションが必要な場合はデプロイ前に実行するステップを追加する
- `environment:` で GitHub Environment を指定する

### YAML 草案

```yaml
# .github/workflows/backend-deploy.yml
name: Backend Deploy

on:
  push:
    branches:
      - dev
      - main
    paths:
      - "apps/api/**"
      - "packages/**"
      - "pnpm-lock.yaml"

jobs:
  deploy-staging:
    name: Deploy API (Staging)
    if: github.ref == 'refs/heads/dev'
    runs-on: ubuntu-latest
    environment: dev
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: "10"

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "24"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run D1 Migrations (staging)
        run: pnpm --filter @ubm-hyogo/api db:migrate
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
        # D1 マイグレーションが不要な場合はこのステップを削除する

      - name: Deploy to Cloudflare Workers (staging)
        run: pnpm --filter @ubm-hyogo/api deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}

  deploy-production:
    name: Deploy API (Production)
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: main
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: "10"

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "24"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run D1 Migrations (production)
        run: pnpm --filter @ubm-hyogo/api db:migrate:production
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}

      - name: Deploy to Cloudflare Workers (production)
        run: pnpm --filter @ubm-hyogo/api deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
```

---

## 4. ワークフロー間の関係図

```
push to feature/* ──────────────────────────► ci.yml (lint + typecheck + build)
                                                    │
push to dev ─────────────────────────────────► ci.yml
                       (apps/web/** 変更あり) ──► web-cd.yml  ──► staging Web Worker
                       (apps/api/** 変更あり) ──► backend-deploy.yml ──► staging API Worker

push to main ────────────────────────────────► ci.yml
                       (apps/web/** 変更あり) ──► web-cd.yml  ──► production Web Worker (要レビュー)
                       (apps/api/** 変更あり) ──► backend-deploy.yml ──► production API Worker (要レビュー)
```

---

## 5. シークレット参照の分類まとめ

| ワークフロー | 使用する secrets | 使用する vars | 使用しない |
| --- | --- | --- | --- |
| `ci.yml` | なし | なし | deploy / runtime 両方 |
| `web-cd.yml` | `CLOUDFLARE_API_TOKEN` | `CLOUDFLARE_ACCOUNT_ID` | `GOOGLE_*` (Cloudflare Secrets 管理) |
| `backend-deploy.yml` | `CLOUDFLARE_API_TOKEN` | `CLOUDFLARE_ACCOUNT_ID` | `GOOGLE_*` (Cloudflare Secrets 管理) |

**原則: ワークフロー YAML には runtime secret を一切記述しない。**

---

## 6. 実装時の注意事項

1. **pnpm filter 名の確認**: 草案内の `@ubm-hyogo/web` / `@ubm-hyogo/api` は実際の `package.json` の `name` フィールドに合わせること
2. **deploy スクリプトの確認**: `pnpm deploy` が `wrangler deploy` を実行するよう `package.json` の `scripts` を設定すること
3. **wrangler.toml の環境設定**: staging と production で異なる Worker 名を使う場合は `[env.staging]` / `[env.production]` セクションを設定すること
4. **D1 マイグレーション**: `db:migrate` スクリプトが存在しない場合はそのステップを削除する
5. **GitHub Environment の保護ルール**: `main` 環境には Required reviewers を設定し、誤った production デプロイを防ぐこと

# Cloudflare Bootstrap Runbook

> docs_only: true — このドキュメントは手順書。実際のリソース作成は担当者が Cloudflare Dashboard / Wrangler CLI で実行する。
> 作成日: 2026-04-23
> 対象タスク: 01b-parallel-cloudflare-base-bootstrap

## 前提条件

- [ ] wrangler CLI がインストール済み (`pnpm add -g wrangler`)
- [ ] `wrangler login` 実行済み（Account ID 確認済み）
- [ ] GitHub リポジトリの `main` / `dev` ブランチが存在する

## Step 1: Cloudflare Pages プロジェクト作成

### 1-A: production（ubm-hyogo-web）

1. Cloudflare Dashboard → Pages → Create a project → Connect to Git
2. GitHub リポジトリを選択
3. Build settings:
   - Framework preset: Next.js
   - Build command: `pnpm --filter @repo/web build`
   - Build output directory: `.next`
4. プロジェクト名: `ubm-hyogo-web`
5. Production branch: `main`
6. Save and Deploy

### 1-B: staging（ubm-hyogo-web-staging）

1. 同様の手順で staging プロジェクトを作成
2. プロジェクト名: `ubm-hyogo-web-staging`
3. Production branch: `dev`
4. Build settings: 同上

```bash
# CLI で確認
wrangler pages list
# → ubm-hyogo-web と ubm-hyogo-web-staging が表示されることを確認
```

## Step 2: Cloudflare Workers サービス確認

wrangler.toml で定義済みのため、初回デプロイは GitHub Actions CI/CD パイプライン経由で実行。
Dashboard での確認のみ実施する。

```bash
# dry-run でデプロイ先を確認
wrangler deploy --dry-run --config apps/api/wrangler.toml
# 期待出力: name = "ubm-hyogo-api"

wrangler deploy --env staging --dry-run --config apps/api/wrangler.toml
# 期待出力: name = "ubm-hyogo-api-staging"
```

## Step 3: D1 データベース作成

```bash
# production D1 作成
wrangler d1 create ubm-hyogo-db-prod
# → 出力された database_id を記録する

# staging D1 作成
wrangler d1 create ubm-hyogo-db-staging
# → 出力された database_id を記録する

# 作成確認
wrangler d1 list
```

**重要**: 出力された `database_id` を `apps/api/wrangler.toml` に記録する:

```toml
[[d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-db-prod"
database_id = "<ここに production の database_id を記入>"

[env.staging]
[[env.staging.d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-db-staging"
database_id = "<ここに staging の database_id を記入>"
```

## Step 4: API Token 作成

1. Cloudflare Dashboard → My Profile → API Tokens → Create Token
2. "Edit Cloudflare Workers" テンプレートを選択
3. スコープを以下の3つのみに設定（最小権限の原則）:
   - Account > Cloudflare Pages > Edit
   - Account > Workers Scripts > Edit
   - Account > D1 > Edit
4. IP フィルタリング: 任意（推奨: GitHub Actions の IP レンジ）
5. TTL: 必要に応じて設定
6. Create Token をクリック
7. 生成されたトークンを安全な場所（1Password 等）に保存

> **注意**: GitHub Secrets への実投入は `04-serial-cicd-secrets-and-environment-sync` タスクで実施する。
> 本 Step では token の作成定義のみ。

## Step 5: Pages 環境変数設定

### production（ubm-hyogo-web）

```bash
# Pages 環境変数設定
wrangler pages secret put NEXT_PUBLIC_API_URL --project-name ubm-hyogo-web
# 値: https://api.ubm-hyogo.workers.dev

# 確認
wrangler pages secret list --project-name ubm-hyogo-web
```

### staging（ubm-hyogo-web-staging）

```bash
wrangler pages secret put NEXT_PUBLIC_API_URL --project-name ubm-hyogo-web-staging
# 値: https://api-staging.ubm-hyogo.workers.dev
```

## Step 6: 検証

```bash
# Pages デプロイ確認
wrangler pages list
curl https://ubm-hyogo-web.pages.dev  # 200 OK を確認

# Workers 確認
wrangler whoami
curl https://api.ubm-hyogo.workers.dev/api/health  # 200 OK を確認

# D1 確認
wrangler d1 list
wrangler d1 execute ubm-hyogo-db-prod --command "SELECT 1"
```

## Rollback 手順

### Pages ロールバック
1. Cloudflare Dashboard → Pages → `ubm-hyogo-web` → Deployments
2. ロールバックしたいデプロイを選択
3. 「Rollback to this deployment」をクリック

### Workers ロールバック
```bash
wrangler rollback --name ubm-hyogo-api
# または staging:
wrangler rollback --name ubm-hyogo-api-staging
```

### D1 ロールバック
```bash
# マイグレーションを逆順で適用（事前にロールバック用 SQL を用意しておくこと）
wrangler d1 execute ubm-hyogo-db-prod --file migrations/rollback/YYYYMMDD_rollback.sql
```

# Cloudflare デプロイメント仕様

> 親仕様書: [deployment.md](deployment.md)
> 役割: Cloudflare インフラ デプロイ仕様

## 概要

ubm-hyogo Webアプリは **Cloudflare** を主要インフラとして使用する。
静的アセット・SSR・APIはすべて Cloudflare のエッジネットワーク上で動作する。

---

## サービス構成

| サービス | 用途 | 対応技術 |
| -------- | ---- | -------- |
| Cloudflare Workers | フロントエンド・Next.js ホスティング、サーバーレスAPI・バックエンドロジック | Next.js 16 + `@opennextjs/cloudflare` / Hono / Workers API |
| Cloudflare D1 | SQLiteデータベース（エッジ） | Drizzle ORM |
| Cloudflare R2 | オブジェクトストレージ（ファイル・画像） | AWS S3互換API |
| Cloudflare KV | 設定・セッションキャッシュ | キーバリューストア |
| Cloudflare Zero Trust | 認証・アクセス制御 | OAuth2 / OIDC |

---

## Cloudflare Workers デプロイ（Next.js / OpenNext）

### セットアップ手順

#### 1. Cloudflareアカウント設定

```bash
# Wrangler CLI のインストール
pnpm add -g wrangler

# Cloudflare アカウントへのログイン
wrangler login
```

#### 2. Workers プロジェクトの確認

```bash
# ローカルビルドの確認
pnpm --filter @ubm-hyogo/web build:cloudflare
```

#### 3. Next.js の OpenNext Workers 設定

`apps/web/next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

`apps/web/wrangler.toml`:

```toml
name = "ubm-hyogo-web"
main = ".open-next/worker.js"
compatibility_date = "2026-04-26"
compatibility_flags = ["nodejs_compat"]

[assets]
directory = ".open-next/assets"
binding = "ASSETS"

[vars]
ENVIRONMENT = "production"
```

#### 4. 環境変数の設定

```bash
# 本番環境シークレット設定
wrangler pages secret put ANTHROPIC_API_KEY --project-name ubm-hyogo-web

# 確認
wrangler pages secret list --project-name ubm-hyogo-web
```

---

## Cloudflare Workers デプロイ（APIバックエンド）

### 構成

```
apps/
  api/           # Cloudflare Workers (Hono)
    src/
      index.ts   # Workers エントリポイント
    wrangler.toml
```

### wrangler.toml（API Workers）

```toml
name = "ubm-hyogo-api"
main = "src/index.ts"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-db"
database_id = "your-d1-database-id"

[[r2_buckets]]
binding = "STORAGE"
bucket_name = "ubm-hyogo-storage"

[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"
```

### デプロイコマンド

```bash
# Workers のデプロイ
wrangler deploy --config apps/api/wrangler.toml

# ログ確認
wrangler tail --config apps/api/wrangler.toml
```

---

## Cloudflare D1 データベース

### セットアップ

```bash
# D1 データベース作成
wrangler d1 create ubm-hyogo-db

# マイグレーション実行
wrangler d1 migrations apply ubm-hyogo-db --remote

# ローカル開発（D1シミュレーター）
wrangler d1 migrations apply ubm-hyogo-db --local
```

### マイグレーション管理

```bash
# 新規マイグレーション作成
wrangler d1 migrations create ubm-hyogo-db "add_users_table"

# マイグレーション一覧
wrangler d1 migrations list ubm-hyogo-db --remote
```

---

## GitHub Actions CI/CD

### 必要なシークレット・変数

| 名前 | 種別 | 説明 |
| ---- | ---- | ---- |
| `CLOUDFLARE_API_TOKEN` | Secret | Cloudflare API トークン |
| `CLOUDFLARE_ACCOUNT_ID` | Secret | CloudflareアカウントID |
| `CLOUDFLARE_PAGES_PROJECT` | Variable | Pages プロジェクト名（例: `ubm-hyogo-web`） |
| `DISCORD_WEBHOOK_URL` | Secret | Discord 通知用 Webhook URL（任意） |

### API トークン権限設定

Cloudflare ダッシュボード → My Profile → API Tokens で以下の権限を付与:

| リソース | 権限 |
| -------- | ---- |
| Cloudflare Pages | Edit |
| Cloudflare Workers | Edit |
| D1 | Edit |

### デプロイフロー（web-cd.yml）

```
push to main
  → Validate Build（型チェック・Lint・ビルド）
  → Deploy to Cloudflare Pages（wrangler-action）
  → Discord 通知
```

---

## プレビューデプロイメント

Cloudflare Pages は PRブランチに対して自動でプレビュー環境を作成する。

| ブランチ | URL形式 | 用途 |
| -------- | ------- | ---- |
| `main` | `ubm-hyogo-web.pages.dev` | 本番 |
| `dev` | `ubm-hyogo-web-staging.pages.dev` | ステージング |
| `feature/*` | `<hash>.ubm-hyogo-web.pages.dev` | プレビュー（PR用） |

### プレビュー設定（GitHub連携）

Cloudflare ダッシュボード → Pages → プロジェクト → Settings → Git Integration で設定。
PRごとに自動プレビューURLが GitHub コメントに投稿される。

---

## カスタムドメイン設定

```bash
# カスタムドメイン追加
wrangler pages domain add ubm-hyogo-web yourdomain.com

# DNS 設定確認
# → CloudflareダッシュボードでCNAMEレコードが自動生成される
# → SSL証明書は自動発行（Let's Encrypt）
```

---

## 環境分離

| 環境 | Pages プロジェクト | ブランチ | D1 データベース |
| ---- | ------------------ | -------- | --------------- |
| 開発 | ローカル wrangler dev | - | ローカルD1シミュレーター |
| ステージング | ubm-hyogo-web-staging | `dev` | ubm-hyogo-db-staging |
| 本番 | ubm-hyogo-web | `main` | ubm-hyogo-db-prod |

### ローカル開発

```bash
# Cloudflare Workers ローカル起動（Pages Functions含む）
wrangler pages dev --compatibility-flag=nodejs_compat apps/web/.next

# または Next.js 開発サーバー（D1シミュレーター使用）
pnpm --filter @repo/web dev
```

---

## ロールバック戦略

### Pages ロールバック

Cloudflare ダッシュボード → Pages → Deployments から過去のデプロイメントを選択して「Rollback to this deployment」をクリック。

```bash
# CLI でのロールバック（特定デプロイメントIDに戻す）
wrangler pages deployment rollback <deployment-id> --project-name ubm-hyogo-web
```

### ロールバック判断基準

| 状況 | 対応 |
| ---- | ---- |
| ビルド失敗 | 自動的に旧バージョン維持（Cloudflare Pages） |
| 機能不具合 | ダッシュボードから1クリックロールバック |
| データベースマイグレーション失敗 | スキーマロールバック + コードロールバック |

---

## コスト概算（個人開発）

| サービス | 無料枠 | 注意点 |
| -------- | ------ | ------ |
| Cloudflare Pages | 無制限リクエスト・500ビルド/月 | 無料枠は商用利用可 |
| Cloudflare Workers | 100,000リクエスト/日 | 超過分 $0.50/100万リクエスト |
| Cloudflare D1 | 5GB ストレージ・500万行読み/日 | 個人開発に十分 |
| Cloudflare R2 | 10GB ストレージ・1,000万読み/月 | エグレス料金なし |
| Cloudflare KV | 100,000読み/日・1,000書き/日 | 小規模用途に十分 |

---

## 変更履歴

| 日付 | バージョン | 変更内容 |
| ---- | ---------- | -------- |
| 2026-04-09 | 1.0.0 | 初版作成（Cloudflare 移行） |

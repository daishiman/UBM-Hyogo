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

[[kv_namespaces]]
binding = "SESSION_KV"
id = "your-kv-namespace-id"
# UT-13 で SESSION_KV に統一。詳細は本ファイル下方「Cloudflare KV セッションキャッシュ」セクション参照
```

> R2 binding は現行 `apps/api/wrangler.toml` には未適用。UT-12 の下流実装時に、下記 R2 セクションの環境別差分を追加する。

### デプロイコマンド

```bash
# Workers のデプロイ
wrangler deploy --config apps/api/wrangler.toml

# ログ確認
wrangler tail --config apps/api/wrangler.toml
```

### Cloudflare R2 ストレージ設定（UT-12）

R2 はファイル・画像などのオブジェクトストレージとして使う。アプリケーションからの直接アクセスは `apps/api` に閉じ、`apps/web` には R2 binding を置かない。

| 項目 | 正本値 / 方針 |
| --- | --- |
| production bucket | `ubm-hyogo-r2-prod` |
| staging bucket | `ubm-hyogo-r2-staging` |
| Workers binding | `R2_BUCKET` |
| Token 方針 | 専用 R2 token を作成し、`Account > Workers R2 Storage > Edit` の最小権限に限定 |
| 公開方針 | private bucket + `apps/api` 経由の presigned URL / proxy access |
| CORS 方針 | production / staging の `AllowedOrigins` を環境別に管理し、実ドメインは secrets / environment 管理に寄せる |

`wrangler.toml` の R2 binding は環境別 bucket を明示する。これは現行設定例ではなく、下流のファイルアップロード実装時に適用する差分である。

```toml
[[env.staging.r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "ubm-hyogo-r2-staging"

[[env.production.r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "ubm-hyogo-r2-prod"
```

CORS ルールは以下をテンプレートとし、`<env-specific-origin>` を環境別に差し替える。

```json
[
  {
    "AllowedOrigins": ["<env-specific-origin>"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Length", "Authorization"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

UT-12 は `spec_created` のため実 bucket 作成・`wrangler.toml` 反映・smoke test 実行は未適用。下流のファイルアップロード実装タスクで `docs/30-workflows/ut-12-cloudflare-r2-storage/outputs/phase-12/implementation-guide.md` を参照して実施する。

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

### D1 PRAGMA 制約

Cloudflare D1 の PRAGMA は SQLite と完全同一に扱わず、Cloudflare の official compatible PRAGMA list を確認してから使う。`wrangler.toml` は D1 binding metadata の管理場所であり、`PRAGMA journal_mode=WAL` のような SQLite PRAGMA を永続設定する場所ではない。

`journal_mode` が official compatible PRAGMA として確認できない場合、staging / production で `PRAGMA journal_mode=WAL` を実行しない。読み書き競合対策は retry/backoff、queue serialization、短い transaction、batch-size 制限を runtime 実装側で扱う。

---

## Cloudflare KV セッションキャッシュ（UT-13 / SESSION_KV）

### 用途と設計方針

| 用途 | キー命名例 | TTL | KV 採否 |
| --- | --- | --- | --- |
| セッションブラックリスト（JWT 失効済み jti） | `session:blacklist:<jti>` | 86400s（24h） | 採用 |
| 設定キャッシュ（読み取り中心） | `config:<key>` | 3600s（1h） | 採用 |
| レートリミットカウンタ（短期 windowing） | `rl:<bucket>:<window>` | 60s〜600s | 採用（書き込み枠注意） |
| ログアウト即時反映 / 権限変更即時反映 | - | - | **不採用**（D1 / Durable Objects） |
| セッション本体保管 | - | - | **不採用**（書き込み枠 1k/日 を消費するため。JWT で完結） |

設計の正本: `docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-02/`。

### 命名規約・バインディング

| 環境 | Namespace 名 | バインディング名 |
| --- | --- | --- |
| production | `ubm-hyogo-kv-prod` | `SESSION_KV` |
| staging | `ubm-hyogo-kv-staging` | `SESSION_KV` |
| staging (preview) | `ubm-hyogo-kv-staging-preview` | `SESSION_KV` |

- バインディング名は全環境で `SESSION_KV` に統一
- Namespace ID は 1Password Environments（`UBM-Hyogo / Cloudflare / KV / <env>`）で集中管理
- `apps/api/wrangler.toml` のみに KV バインディングを配置（`apps/web` からの直接利用は禁止）

### wrangler.toml バインディング例（DRY 化済み）

```toml
[[kv_namespaces]]
binding = "SESSION_KV"
id = "<local-preview-id>"
preview_id = "<local-preview-id>"

[vars]
SESSION_BLACKLIST_TTL_SECONDS = "86400"
CONFIG_CACHE_TTL_SECONDS     = "3600"
RATE_LIMIT_WINDOW_SECONDS    = "60"

[env.staging]
[[env.staging.kv_namespaces]]
binding = "SESSION_KV"
id = "<staging-namespace-id>"
preview_id = "<staging-kv-preview-namespace-id>"

[env.production]
[[env.production.kv_namespaces]]
binding = "SESSION_KV"
id = "<production-namespace-id>"
```

### 無料枠と運用方針

| 制約項目 | 上限 | 監視閾値（推奨） |
| --- | --- | --- |
| read / day | 100,000 | 70,000（70%）で警告 |
| write / day | 1,000 | 700（70%）で警告、900（90%）で対応 |
| storage | 1 GB | 700 MB（70%）で警告 |

枯渇時のフォールバック: 用途縮退（レートリミット停止 → Durable Objects 移行検討）、ストレージは TTL 経過済みキーの bulk delete。

### 最終的一貫性制約（最大 60 秒の伝搬遅延）

- `put` 直後の `get` を同設計内で行わない（別エッジで旧値が返る可能性）
- 即時反映が必要な操作（ログアウト無効化・権限変更）は **D1 または Durable Objects** を使用する
- セッションブラックリストは「ヒット = 拒否」のみ実装し、即時失効は D1 セッションフラグで多層防御
- TTL は最小 60 秒以上（最終的一貫性以下に設定しない）

### KV Namespace 作成コマンド

```bash
wrangler kv:namespace create ubm-hyogo-kv-prod
wrangler kv:namespace create ubm-hyogo-kv-staging
wrangler kv:namespace create ubm-hyogo-kv-staging --preview
```

### 動作確認（smoke test）

```bash
wrangler kv:key put --binding=SESSION_KV --env=staging "verify:phase-05" "ok"
wrangler kv:key get --binding=SESSION_KV --env=staging "verify:phase-05"
wrangler kv:key delete --binding=SESSION_KV --env=staging "verify:phase-05"
```

### Worker 実装パターン

```ts
export interface Env {
  DB: D1Database
  STORAGE: R2Bucket
  SESSION_KV: KVNamespace
  SESSION_BLACKLIST_TTL_SECONDS: string
}

export async function isSessionBlacklisted(env: Env, jti: string): Promise<boolean> {
  const v = await env.SESSION_KV.get(`session:blacklist:${jti}`)
  return v !== null
}

export async function blacklistSession(env: Env, jti: string, ttlSec: number): Promise<void> {
  await env.SESSION_KV.put(`session:blacklist:${jti}`, "1", { expirationTtl: ttlSec })
}
```

### 関連 spec

- `docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-05/kv-bootstrap-runbook.md` （runbook）
- `docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-02/eventual-consistency-guideline.md` （最終的一貫性の設計指針）
- `docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-07/handoff.md` （下流タスク向けハンドオフ）

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

## モニタリング/アラート（UT-08 連携）

UT-08（`docs/30-workflows/completed-tasks/ut-08-monitoring-alert-design/`）で以下を SSOT として確定。実装は UT-08-IMPL（Wave 2）。

| 項目 | 値 |
| ---- | -- |
| WAE binding 名 | `MONITORING_AE` |
| WAE dataset 名 | `ubm_hyogo_monitoring` |
| 主要イベント | `api.request` / `api.error` / `d1.query.fail` / `cron.sync.start` / `cron.sync.end` |
| 任意イベント | `auth.fail`（UT-13 認証実装で採否確定） |
| PII 除外 | email / userId / IP は WAE data point に含めない |
| 外部監視 | UptimeRobot 無料プラン（5 分間隔） |

詳細は `lessons-learned-ut08-monitoring-design-2026-04.md` および `workflow-ut08-monitoring-alert-design-artifact-inventory.md` を参照。

---

## 変更履歴

| 日付 | バージョン | 変更内容 |
| ---- | ---------- | -------- |
| 2026-04-09 | 1.0.0 | 初版作成（Cloudflare 移行） |
| 2026-04-27 | 1.1.0 | UT-08 モニタリング/アラート設計の SSOT 連携セクション追加 |

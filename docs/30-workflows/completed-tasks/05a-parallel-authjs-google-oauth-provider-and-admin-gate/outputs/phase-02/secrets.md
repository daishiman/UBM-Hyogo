# secrets.md — env / secrets table

## secrets 一覧

| 名前 | 用途 | 配置先 (本番/staging) | ローカル | CI/CD |
| --- | --- | --- | --- | --- |
| `AUTH_SECRET` | JWT 署名鍵 (HS256, 256bit 以上) | Cloudflare Secrets (両 worker) | 1Password (`op://...`) | - |
| `AUTH_GOOGLE_ID` | Google OAuth client ID | Cloudflare Secrets (apps/web) | 1Password | - |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret | Cloudflare Secrets (apps/web) | 1Password | - |
| `INTERNAL_AUTH_SECRET` | apps/web → apps/api 内部認証 | Cloudflare Secrets (両 worker、同値) | 1Password | - |
| `SYNC_ADMIN_TOKEN` (既存) | sync 系 cron 認証 | Cloudflare Secrets (apps/api) | 1Password | - |

## vars 一覧（非機密）

| 名前 | 用途 | 配置先 |
| --- | --- | --- |
| `AUTH_URL` | OAuth redirect base URL | wrangler vars (apps/web) |
| `AUTH_GOOGLE_ALLOWED_HD` | Hosted domain 制限（OFF 推奨）| wrangler vars (apps/web) – 設定しない |
| `INTERNAL_API_BASE_URL` | apps/web から apps/api への base URL | wrangler vars (apps/web) |

## 配線手順（Phase 5 で詳細化）

### 1. AUTH_SECRET 生成

```bash
openssl rand -base64 48
# Cloudflare Secrets に登録
bash scripts/cf.sh secret put AUTH_SECRET --config apps/web/wrangler.toml --env production
bash scripts/cf.sh secret put AUTH_SECRET --config apps/api/wrangler.toml --env production
# 両 worker で同値（apps/api の requireAuth が apps/web 発行 JWT を verify するため）
```

### 2. Google OAuth credentials

1. Google Cloud Console で OAuth 2.0 Client ID 発行
2. Authorized redirect URIs:
   - `https://<production>.example.com/api/auth/callback/google`
   - `https://<staging>.example.com/api/auth/callback/google`
3. 取得した `client_id` / `client_secret` を Cloudflare Secrets に登録

```bash
bash scripts/cf.sh secret put AUTH_GOOGLE_ID --config apps/web/wrangler.toml --env production
bash scripts/cf.sh secret put AUTH_GOOGLE_SECRET --config apps/web/wrangler.toml --env production
```

### 3. INTERNAL_AUTH_SECRET 生成

```bash
openssl rand -base64 32
# 両 worker に同値で登録
bash scripts/cf.sh secret put INTERNAL_AUTH_SECRET --config apps/web/wrangler.toml --env production
bash scripts/cf.sh secret put INTERNAL_AUTH_SECRET --config apps/api/wrangler.toml --env production
```

### 4. AUTH_URL 設定

```toml
# apps/web/wrangler.toml
[env.production.vars]
AUTH_URL = "https://example.com"
INTERNAL_API_BASE_URL = "https://api.example.com"

[env.staging.vars]
AUTH_URL = "https://staging.example.com"
INTERNAL_API_BASE_URL = "https://api-staging.example.com"
```

## 1Password の運用

| 項目 | Vault | Item | Field |
| --- | --- | --- | --- |
| AUTH_SECRET | UBM-Hyogo | auth-secret | password |
| AUTH_GOOGLE_ID | UBM-Hyogo | google-oauth-client | client_id |
| AUTH_GOOGLE_SECRET | UBM-Hyogo | google-oauth-client | client_secret |
| INTERNAL_AUTH_SECRET | UBM-Hyogo | internal-auth-secret | password |

ローカル開発では `.env` に `AUTH_SECRET=op://UBM-Hyogo/auth-secret/password` のような参照のみを書き、`scripts/with-env.sh` 経由で `op run` で動的注入。

## gitleaks 設定

リポジトリに以下が含まれていないこと:
- `AUTH_SECRET=<実値>` 
- `client_secret":"<実値>"` 
- `INTERNAL_AUTH_SECRET=<実値>`

`.gitleaks.toml` に Auth.js / Google OAuth の高エントロピー文字列パターンを追加検討（infra 04 で運用済の場合は流用）。

## AC-6 / AC-7 充足

- AC-6: secrets はリポジトリに名前のみ存在、実値は Cloudflare Secrets / 1Password
- AC-7: spec 08-free-database 表の `AUTH_SECRET` / `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` 行に準拠

## 不変条件マッピング

| # | 対応 |
| --- | --- |
| #5 | `INTERNAL_AUTH_SECRET` で apps/web→apps/api の経路を保護（D1 直接禁止の代替経路） |
| #10 | secrets は無料の Cloudflare Secrets / GitHub Secrets / 1Password を利用、コスト 0 |

## 監査ポイント

| 項目 | チェック方法 |
| --- | --- |
| AUTH_SECRET の長さ | `wrangler secret list` で存在確認、長さは 1Password で 256bit 以上担保 |
| Google OAuth redirect URI | Console で staging/production の 2 件のみ登録（debug URL を残さない） |
| INTERNAL_AUTH_SECRET 漏洩検知 | apps/api log の 401 件数（短時間で急増したら rotate） |
| Hosted domain | `AUTH_GOOGLE_ALLOWED_HD` を設定しない（個人 Gmail 許可） |

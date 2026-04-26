# 環境別シークレット管理マトリクス

## シークレット一覧

| シークレット名 | 種別 | 内容 |
| --- | --- | --- |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Service Account JSON key | GCP Service Account の認証情報（秘密鍵含む） |

## 環境別管理方法

| 環境 | 注入方法 | ストア | コミット可否 |
| --- | --- | --- | --- |
| ローカル開発 | `wrangler dev` が自動読み込み | `.dev.vars`（プロジェクトルート or `apps/api/`） | **不可**（`.gitignore` 必須） |
| staging | Cloudflare Secrets | `wrangler secret put --env staging` | 不可（Cloudflare 管理） |
| production | Cloudflare Secrets | `wrangler secret put --env production` | 不可（Cloudflare 管理） |
| CI/CD (GitHub Actions) | GitHub Secrets → `wrangler secret put` | `GOOGLE_SERVICE_ACCOUNT_JSON` as GitHub Secret | 不可 |

## .dev.vars 記述形式

```ini
# .dev.vars（ローカル開発専用・コミット禁止）
# JSON は改行なし1行で記述。private_key 内の改行は \n エスケープにする
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...@...iam.gserviceaccount.com","token_uri":"https://oauth2.googleapis.com/token"}
```

## Cloudflare Secrets 配置コマンド

```bash
# staging 環境（JSON を1行に圧縮した文字列を貼り付ける）
wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON --env staging

# production 環境
wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON --env production

# 確認（値は表示されない）
wrangler secret list --env staging
wrangler secret list --env production
```

## .gitignore 確認事項

`.gitignore` に以下が含まれていること：

```
.dev.vars
```

確認コマンド：
```bash
grep -n "\.dev\.vars" .gitignore
```

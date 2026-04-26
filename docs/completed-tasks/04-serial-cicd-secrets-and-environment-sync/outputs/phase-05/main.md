# Phase 5 成果物: セットアップ実行手順書

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | cicd-secrets-and-environment-sync |
| Phase 番号 | 5 / 13 |
| Phase 名称 | セットアップ実行 |
| 作成日 | 2026-04-26 |
| 前 Phase | 4 (事前検証手順) |
| 次 Phase | 6 (異常系検証) |
| 状態 | completed |

---

## 前提

Phase 4 の事前検証が全項目 PASS であること。
各コマンドの `<PLACEHOLDER>` は実際の値に置き換えて実行する。
実値はこの文書に書かず、1Password Environments に記録する。

---

## 1. GitHub Secrets への変数投入手順

### 1-1. 対象変数

| 変数名 | 分類 | 説明 |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | deploy secret | Wrangler が Workers をデプロイする際に使用する API トークン |
| `CLOUDFLARE_ACCOUNT_ID` | deploy metadata | Cloudflare アカウントの識別子 |

> `GOOGLE_*` は runtime secret のため GitHub Secrets には登録しない。

### 1-2. 登録コマンド

```bash
# CLOUDFLARE_API_TOKEN の登録
# 実値は 1Password から取得し、コマンドライン引数に渡す
gh secret set CLOUDFLARE_API_TOKEN --body "<TOKEN_FROM_1PASSWORD>"

# または標準入力から渡す (ヒストリに残らないため推奨)
gh secret set CLOUDFLARE_API_TOKEN < <(op read "op://UBM-Hyogo/Cloudflare/api_token")

# CLOUDFLARE_ACCOUNT_ID の登録
gh secret set CLOUDFLARE_ACCOUNT_ID --body "<ACCOUNT_ID_FROM_1PASSWORD>"
```

### 1-3. 完了確認

```bash
gh secret list
# 期待出力:
# CLOUDFLARE_API_TOKEN  Updated <date>
# CLOUDFLARE_ACCOUNT_ID Updated <date>
```

---

## 2. Cloudflare Secrets への変数投入手順

### 2-1. 対象変数と Worker の対応

| 変数名 | Web Worker | API Worker | 説明 |
| --- | --- | --- | --- |
| `GOOGLE_CLIENT_SECRET` | 要 | 要 | Google OAuth 認証に使用する runtime secret |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | 不要 | 要 | Google Forms API にアクセスする runtime secret |

### 2-2. Web Worker への登録

```bash
# staging (dev ブランチ対応)
wrangler secret put GOOGLE_CLIENT_SECRET --name <WEB_WORKER_NAME_STAGING>
# プロンプトが表示されるので 1Password から取得した値を貼り付ける

# production (main ブランチ対応)
wrangler secret put GOOGLE_CLIENT_SECRET --name <WEB_WORKER_NAME_PRODUCTION>
```

### 2-3. API Worker への登録

```bash
# staging
wrangler secret put GOOGLE_CLIENT_SECRET --name <API_WORKER_NAME_STAGING>
wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON --name <API_WORKER_NAME_STAGING>

# production
wrangler secret put GOOGLE_CLIENT_SECRET --name <API_WORKER_NAME_PRODUCTION>
wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON --name <API_WORKER_NAME_PRODUCTION>
```

> `GOOGLE_SERVICE_ACCOUNT_JSON` の値は JSON 文字列を1行に圧縮したものを入力する。
> `jq -c . service-account.json` で圧縮できるが、ファイルはリポジトリに含めない。

### 2-4. 完了確認

```bash
wrangler secret list --name <WEB_WORKER_NAME_STAGING>
# 期待出力: GOOGLE_CLIENT_SECRET が存在する

wrangler secret list --name <API_WORKER_NAME_STAGING>
# 期待出力: GOOGLE_CLIENT_SECRET / GOOGLE_SERVICE_ACCOUNT_JSON が存在する
```

---

## 3. GitHub Environments の設定手順

### 3-1. 2環境の作成

GitHub リポジトリ設定画面 (`Settings > Environments`) から以下の2環境を作成する。

| Environment 名 | 対応ブランチ | 対応 Cloudflare | Protection ルール |
| --- | --- | --- | --- |
| `dev` | `dev` | staging Workers | なし (自動デプロイ) |
| `main` | `main` | production Workers | Required reviewers: 2名 |

### 3-2. gh CLI での作成 (API 経由)

```bash
# dev 環境の作成
gh api --method PUT repos/{owner}/{repo}/environments/dev \
  --field wait_timer=0

# main 環境の作成 (保護ルール付き)
gh api --method PUT repos/{owner}/{repo}/environments/main \
  --field reviewers='[{"type":"User","id":<USER_ID>}]'
```

### 3-3. 環境へのシークレットのスコープ設定

GitHub Secrets を特定の Environment にスコープするには:

```bash
# dev 環境専用のシークレット設定 (Environment-scoped)
gh secret set CLOUDFLARE_API_TOKEN --env dev --body "<TOKEN_STAGING>"
gh secret set CLOUDFLARE_API_TOKEN --env main --body "<TOKEN_PRODUCTION>"
```

> staging と production で異なる API トークンを使う場合は環境スコープで分離する。
> 同一トークンを使う場合はリポジトリレベルの secret で十分。

### 3-4. 完了確認

```bash
gh api repos/{owner}/{repo}/environments
# 期待出力: dev / main の2環境が存在する
```

---

## 4. GitHub Variables の設定手順

### 4-1. 対象変数

| 変数名 | 値 (プレースホルダー) | 説明 |
| --- | --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | `<ACCOUNT_ID>` | 非機密のアカウント識別子。Secrets でなく Variables で管理 |
| `WEB_WORKER_NAME_STAGING` | `<WEB_WORKER_STAGING>` | staging Web Worker 名 |
| `WEB_WORKER_NAME_PRODUCTION` | `<WEB_WORKER_PRODUCTION>` | production Web Worker 名 |
| `API_WORKER_NAME_STAGING` | `<API_WORKER_STAGING>` | staging API Worker 名 |
| `API_WORKER_NAME_PRODUCTION` | `<API_WORKER_PRODUCTION>` | production API Worker 名 |

> CLOUDFLARE_ACCOUNT_ID は機密性が低いため Variables で管理してもよい。
> ただし組織のセキュリティポリシーに応じて Secrets に格上げすること。

### 4-2. 登録コマンド

```bash
gh variable set CLOUDFLARE_ACCOUNT_ID --body "<ACCOUNT_ID>"
gh variable set WEB_WORKER_NAME_STAGING --body "<WEB_WORKER_STAGING>"
gh variable set WEB_WORKER_NAME_PRODUCTION --body "<WEB_WORKER_PRODUCTION>"
gh variable set API_WORKER_NAME_STAGING --body "<API_WORKER_STAGING>"
gh variable set API_WORKER_NAME_PRODUCTION --body "<API_WORKER_PRODUCTION>"
```

### 4-3. 完了確認

```bash
gh variable list
# 期待出力: 上記5変数が全て登録済み
```

---

## 5. 1Password Environments への記録手順

### 5-1. 記録対象

| アイテム名 (例) | フィールド | 説明 |
| --- | --- | --- |
| `UBM-Hyogo Cloudflare` | `api_token` | Cloudflare API トークン |
| `UBM-Hyogo Cloudflare` | `account_id` | Cloudflare アカウント ID |
| `UBM-Hyogo Google OAuth` | `client_secret` | Google OAuth クライアントシークレット |
| `UBM-Hyogo Google Service Account` | `service_account_json` | Google Service Account JSON (full) |

### 5-2. 記録手順 (op CLI)

```bash
# Vault の確認
op vault list
# 期待出力: UBM-Hyogo 用 Vault が存在する

# アイテムの作成 (初回)
op item create \
  --category login \
  --title "UBM-Hyogo Cloudflare" \
  --vault "<VAULT_NAME>" \
  "api_token[password]=<ACTUAL_TOKEN>" \
  "account_id[text]=<ACTUAL_ACCOUNT_ID>"

# アイテムの更新 (2回目以降)
op item edit "UBM-Hyogo Cloudflare" \
  "api_token[password]=<NEW_TOKEN>"

# 確認
op item get "UBM-Hyogo Cloudflare" --fields api_token
```

### 5-3. ローカル開発での利用方法

```bash
# .env.local を 1Password から動的生成する (平文ファイルを正本にしない)
op inject --in-file .env.local.tpl --out-file .env.local

# .env.local.tpl の例 (リポジトリ管理可)
# GOOGLE_CLIENT_SECRET={{ op://UBM-Hyogo/UBM-Hyogo Google OAuth/client_secret }}
```

> `.env.local` は `.gitignore` に追加し、絶対にコミットしない。
> `.env.local.tpl` はプレースホルダー形式のためリポジトリ管理可能。

---

## 6. 各ステップの完了確認まとめ

| ステップ | 確認コマンド | PASS 条件 |
| --- | --- | --- |
| GitHub Secrets 登録 | `gh secret list` | `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` が存在 |
| Cloudflare Secrets 登録 (web) | `wrangler secret list --name <WEB_WORKER>` | `GOOGLE_CLIENT_SECRET` が存在 |
| Cloudflare Secrets 登録 (api) | `wrangler secret list --name <API_WORKER>` | `GOOGLE_CLIENT_SECRET` / `GOOGLE_SERVICE_ACCOUNT_JSON` が存在 |
| GitHub Environments 設定 | `gh api repos/.../environments` | `dev` / `main` の2環境が存在 |
| GitHub Variables 設定 | `gh variable list` | Worker 名変数が全て存在 |
| 1Password 記録 | `op item list --vault <VAULT>` | UBM-Hyogo 関連アイテムが存在 |
| ワークフロー草案作成 | `ls .github/workflows/` | 3ファイルが存在 |

---

## 7. Phase 6 (異常系検証) への引き継ぎ事項

### 引き継ぎ情報

| 項目 | 内容 |
| --- | --- |
| 設定済み GitHub Secrets | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` |
| 設定済み Cloudflare Secrets | `GOOGLE_CLIENT_SECRET` (web + api), `GOOGLE_SERVICE_ACCOUNT_JSON` (api) |
| 設定済み GitHub Environments | `dev`, `main` |
| 作成済みワークフロー草案 | `ci.yml`, `web-cd.yml`, `backend-deploy.yml` (github-actions-drafts.md を参照) |

### Phase 6 で検証すべき異常系シナリオの候補

- runtime secret が GitHub Secrets に誤登録された場合
- deploy secret が Cloudflare Secrets に誤登録された場合
- ワークフローが `feature/*` ブランチでデプロイをトリガーした場合
- secret rotation 後にワークフローが古いトークンで失敗した場合
- rollback が必要になった場合の手順

### ブロック条件

- 本 Phase の全完了確認がPASSでなければ Phase 6 に進まない
- `github-actions-drafts.md` が作成済みであること (github-actions-drafts.md を参照)

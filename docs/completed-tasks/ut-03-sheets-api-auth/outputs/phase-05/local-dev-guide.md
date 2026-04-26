# ローカル開発ガイド（.dev.vars を使ったシークレット注入）

## 概要

ローカル開発では Cloudflare Secrets の代わりに `.dev.vars` ファイルを使用してシークレットを注入する。`wrangler dev` は自動的に `.dev.vars` を読み込む。

## セットアップ手順

### 1. `.dev.vars` ファイルの作成

```bash
# apps/api/ または プロジェクトルートに作成
touch apps/api/.dev.vars
```

### 2. Service Account JSON の記述

```ini
# apps/api/.dev.vars
# このファイルは .gitignore に含まれます（絶対にコミットしないこと）
# JSON は改行なしの1行で記述してください
# private_key 内の改行は \n エスケープにしてください
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"ubm-hyogo","private_key_id":"abc123","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n","client_email":"ubm-hyogo-sheets-reader@ubm-hyogo.iam.gserviceaccount.com","token_uri":"https://oauth2.googleapis.com/token"}
```

### 3. JSON の1行化方法

1Password の Service Account JSON key を取得後：

```bash
# ファイルから1行化
cat sa-key.json | jq -c .

# macOS クリップボードにコピー
cat sa-key.json | jq -c . | pbcopy
```

### 4. `.gitignore` 確認

```bash
grep "\.dev\.vars" .gitignore
# .dev.vars
# **/.dev.vars
# と表示されれば OK
```

### 5. wrangler dev 起動

```bash
mise exec -- pnpm --filter api exec wrangler dev
# または
mise exec -- wrangler dev apps/api/src/index.ts
```

起動時に以下のようなログが表示されることを確認：
```
Loaded .dev.vars
```

## 注意事項

- `.dev.vars` に real の Service Account JSON key を記述する場合、ファイルを安全な場所に保管すること
- `.dev.vars` を git add しないこと（`.gitignore` で除外済み）
- CI/CD 環境では `.dev.vars` を使わず GitHub Secrets を使用すること

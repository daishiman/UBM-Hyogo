# Sheets API 認証 セットアップ Runbook

## 1. Google Cloud Console での Service Account 作成

1. Google Cloud Console（https://console.cloud.google.com）にアクセスする
2. 対象プロジェクト（`ubm-hyogo`）を選択する

### 1-1. Sheets API v4 の有効化

```bash
gcloud services enable sheets.googleapis.com --project=<PROJECT_ID>
# または GCP Console → APIとサービス → ライブラリ → Google Sheets API → 有効にする
```

### 1-2. Service Account の作成

```bash
gcloud iam service-accounts create ubm-hyogo-sheets-reader \
  --display-name="UBM Hyogo Sheets Reader" \
  --project=<PROJECT_ID>
```

### 1-3. JSON Key のダウンロード

```bash
gcloud iam service-accounts keys create /tmp/sa-key.json \
  --iam-account=ubm-hyogo-sheets-reader@<PROJECT_ID>.iam.gserviceaccount.com

# ダウンロード後、1Password に保管し /tmp/sa-key.json を削除する
rm /tmp/sa-key.json
```

> **重要**: JSON key ファイルには秘密鍵が含まれる。リポジトリに絶対にコミットしないこと。

## 2. Cloudflare Secrets への配置

```bash
# JSON key ファイルの内容を1行に圧縮してから登録する
cat sa-key.json | jq -c . | wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON --env staging
cat sa-key.json | jq -c . | wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON --env production

# 確認（値は表示されない）
wrangler secret list --env staging
wrangler secret list --env production
```

## 3. Google Sheets スプレッドシートへの共有設定

1. 対象スプレッドシート（formId: `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg`）を開く
2. 右上「共有」ボタンをクリック
3. Service Account メールアドレスを入力: `ubm-hyogo-sheets-reader@<PROJECT_ID>.iam.gserviceaccount.com`
4. 権限: `閲覧者` を選択
5. 「送信」をクリック

## 4. Service Account JSON key のローテーション手順

既存キーが漏洩・期限切れの場合:

```bash
# 1. 古いキーの失効（Google Cloud Console から）
gcloud iam service-accounts keys delete <KEY_ID> \
  --iam-account=ubm-hyogo-sheets-reader@<PROJECT_ID>.iam.gserviceaccount.com

# 2. 新しいキーの発行
gcloud iam service-accounts keys create /tmp/new-sa-key.json \
  --iam-account=ubm-hyogo-sheets-reader@<PROJECT_ID>.iam.gserviceaccount.com

# 3. Cloudflare Secrets の更新
cat /tmp/new-sa-key.json | jq -c . | wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON --env staging
cat /tmp/new-sa-key.json | jq -c . | wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON --env production

# 4. 新しいキーを1Password に保管し一時ファイルを削除
rm /tmp/new-sa-key.json
```

## 5. Sheets API v4 疎通確認（ローカル）

`wrangler dev` 起動中に以下を実行:

```bash
SPREADSHEET_ID="119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg"
ACCESS_TOKEN="<getAccessToken()で取得したtoken>"

curl -s \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  "https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?fields=spreadsheetId,properties.title" \
  | jq .

# 期待レスポンス:
# {
#   "spreadsheetId": "119ec539...",
#   "properties": { "title": "UBM兵庫 会員フォーム" }
# }
```

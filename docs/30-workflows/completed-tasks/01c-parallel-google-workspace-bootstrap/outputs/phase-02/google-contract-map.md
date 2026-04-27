# Google Workspace Contract Map

## OAuth / SA / Sheet 権限マップ

| コンポーネント | 種別 | 用途 | 権限 | 配置先 |
|----------------|------|------|------|--------|
| GOOGLE_CLIENT_ID | OAuth client | ユーザー認証（将来） | N/A | Cloudflare Secrets |
| GOOGLE_CLIENT_SECRET | OAuth secret | ユーザー認証（将来） | N/A | Cloudflare Secrets |
| GOOGLE_SERVICE_ACCOUNT_JSON | SA key | Sheets読み込み | https://www.googleapis.com/auth/spreadsheets.readonly | Cloudflare Secrets |
| GOOGLE_SHEET_ID | resource id | 対象スプレッドシート特定 | N/A（non-secret） | GitHub Variables |

- ローカル開発の値は `1Password Environments` を正本にし、平文 `.env` を正本にしない。

## 責務分離の原則

```
OAuth client (GOOGLE_CLIENT_ID/SECRET)
  └── 用途: ユーザーが Google アカウントでログインする（将来）
  └── flow: Authorization Code Flow with PKCE
  └── 初回スコープ: 設定のみ（実際の認証フローは別タスク）

Service Account (GOOGLE_SERVICE_ACCOUNT_JSON)
  └── 用途: サーバーがシートデータを自動読み込みする
  └── flow: Service Account JWT auth
  └── 初回スコープ: メンバー情報シートの読み込み
```

## Sheet Access Contract

- **アクセス制御**: SAのメールアドレスを対象シートに「閲覧者」として共有する
- **scope**: `https://www.googleapis.com/auth/spreadsheets.readonly`
- **SHEET_ID**: 環境ごとに異なる（dev/prod）→ GitHub Variables で管理
- **D1との関係**: Sheetsから読み込んだデータはD1に書き込む（D1がcanonical DB）

## Secret 命名の統一規則

- `GOOGLE_CLIENT_ID` → OAuth client ID
- `GOOGLE_CLIENT_SECRET` → OAuth client secret
- `GOOGLE_SERVICE_ACCOUNT_JSON` → Service account の JSON key（base64 or raw JSON）
- `GOOGLE_SHEET_ID` → スプレッドシートの ID（URL の `/d/[ID]/` 部分）

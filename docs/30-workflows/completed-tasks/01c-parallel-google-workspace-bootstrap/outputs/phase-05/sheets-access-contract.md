# Google Sheets Access Contract

## 概要
Google Sheets を入力源（read-only）として利用するための接続契約書。

## アクセス設定
| 項目 | 値 |
|------|-----|
| アクセス主体 | Service Account: ubm-hyogo-sheets-reader |
| 認証方式 | Service Account JSON key |
| アクセス権限 | 閲覧者（read-only） |
| スコープ | https://www.googleapis.com/auth/spreadsheets.readonly |
| SHEET_ID 管理 | GitHub Variables（GOOGLE_SHEET_ID） |

## データフロー
```
Google Sheets (input source)
    ↓ [Service Account, https://www.googleapis.com/auth/spreadsheets.readonly]
apps/api (packages/integrations/google)
    ↓ [データ変換・バリデーション]
Cloudflare D1 (canonical DB)
```

## 責務境界
- Google Sheets: 入力源のみ（書き込み禁止）
- D1: canonical DB（Sheetsのデータを正規化して保存）
- OAuth client: ユーザー認証用（Sheets読み込みには使わない）
- Service Account: Sheets読み込み専用（ユーザー認証には使わない）
- ローカル開発の値は `1Password Environments` を正本にし、平文 `.env` を正本にしない。

## アクセス停止手順
1. Google Cloud Console > IAM > Service Accounts > ubm-hyogo-sheets-reader を無効化 or キーを削除
2. または対象スプレッドシートから SA メールアドレスの共有を解除

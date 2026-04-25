# Phase 5 主成果物: セットアップ実行

## セットアップ完了チェックリスト

- [ ] Google Cloud Project が作成された
- [ ] Sheets API が有効化された
- [ ] Drive API が有効化された
- [ ] OAuth Consent Screen が設定された
- [ ] OAuth Client ID が作成された（ubm-hyogo-web）
- [ ] Service Account が作成された（ubm-hyogo-sheets-reader）
- [ ] Service Account の JSON key がダウンロードされた
- [ ] 対象スプレッドシートに SA がアクセス共有された
- [ ] GOOGLE_CLIENT_ID が Cloudflare Secrets に投入された
- [ ] GOOGLE_CLIENT_SECRET が Cloudflare Secrets に投入された
- [ ] GOOGLE_SERVICE_ACCOUNT_JSON が Cloudflare Secrets に投入された
- [ ] GOOGLE_SHEET_ID が GitHub Variables に設定された

## 実値プレースホルダー一覧
| 変数名 | 実値の保管場所 |
|--------|----------------|
| GOOGLE_CLIENT_ID | 1Password > UBM-Hyogo > Google OAuth Client ID |
| GOOGLE_CLIENT_SECRET | 1Password > UBM-Hyogo > Google OAuth Client Secret |
| GOOGLE_SERVICE_ACCOUNT_JSON | 1Password > UBM-Hyogo > Google SA JSON |
| GOOGLE_SHEET_ID | GitHub > daishiman/UBM-Hyogo > Variables |

※ 実値はこのドキュメントに記載しない

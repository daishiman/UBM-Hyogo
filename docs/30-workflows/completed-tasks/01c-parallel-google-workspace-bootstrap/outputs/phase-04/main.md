# Phase 4 主成果物: 事前検証手順

## Google Workspace 連携基盤 - 事前確認チェックリスト

### 前提条件確認
- [ ] Google アカウントにアクセスできる
- [ ] Google Cloud Console (console.cloud.google.com) にアクセスできる
- [ ] 新規 Google Cloud Project を作成できる権限がある

### 既存設定の確認
| 確認項目 | 確認方法 | 期待値 |
|----------|----------|--------|
| GCP プロジェクト | Cloud Console > プロジェクト一覧 | ubm-hyogo が未存在 |
| Service Account | Cloud Console > IAM > Service Accounts | ubm-hyogo-sheets-reader が未存在 |
| Sheets API | Cloud Console > APIs & Services > Library | 無効状態 |
| Drive API | Cloud Console > APIs & Services > Library | 無効状態 |
| OAuth Client | Cloud Console > APIs & Services > Credentials | 未作成 |

### Secret名の確認
以下の変数名で task 間に競合がないことを確認する：
- `GOOGLE_CLIENT_ID` - 他のタスクで使用されていないこと
- `GOOGLE_CLIENT_SECRET` - 他のタスクで使用されていないこと
- `GOOGLE_SERVICE_ACCOUNT_JSON` - 他のタスクで使用されていないこと
- `GOOGLE_SHEET_ID` - 他のタスクで使用されていないこと

### ブロッカーと対処
| ブロッカー | 対処 |
|-----------|------|
| GCP Projectが既存 | 既存Projectを再利用するか、別名で作成 |
| SAが既存 | 既存SAのkey状態を確認し、必要なら新規作成 |
| API有効化済み | そのまま使用可能、手順をスキップ |

### Phase 5 への引き継ぎ
- 全前提条件がOKであることを確認してからPhase 5に進む
- ブロッカーが発生した場合は対処後に再確認する

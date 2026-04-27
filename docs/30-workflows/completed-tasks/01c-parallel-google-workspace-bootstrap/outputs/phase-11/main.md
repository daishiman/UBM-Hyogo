# Phase 11 主成果物: 手動 Smoke Test

## Smoke Test 結果

### テスト項目チェックリスト
- [ ] GCP プロジェクト `ubm-hyogo` が存在する
- [ ] Sheets API が有効化されている
- [ ] Drive API が有効化されている
- [ ] OAuth Client `ubm-hyogo-web` が作成されている
- [ ] Service Account `ubm-hyogo-sheets-reader` が Active
- [ ] SA に有効な JSON key が存在する
- [ ] 対象スプレッドシートに SA が閲覧者として共有されている
- [ ] GOOGLE_CLIENT_ID が Cloudflare Secrets に存在する
- [ ] GOOGLE_CLIENT_SECRET が Cloudflare Secrets に存在する
- [ ] GOOGLE_SERVICE_ACCOUNT_JSON が Cloudflare Secrets に存在する
- [ ] GOOGLE_SHEET_ID が GitHub Variables に存在する

### 判定
- 全チェックが ✅ になればPhase 12（ドキュメント更新）へ進む
- ✅ になっていない項目があれば、Phase 5（セットアップ実行）に戻る

## 手動テストの注意
- 本Phaseは実際のセットアップ完了後に実施する
- 現時点では仕様書作成フェーズのため、チェックリストは未チェック状態

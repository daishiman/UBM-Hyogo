# Phase 11: 手動 smoke 実行サマリ

## 実行範囲（仕様）

| 項目 | 内容 |
| --- | --- |
| 環境 | dev（最低限）、staging / production は Phase 13 後 |
| 検証対象 | `getSheetsAccessToken()` → Sheets API v4 `spreadsheets.values.get` |
| visualEvidence | NON_VISUAL（curl / wrangler dev log のみ） |
| 実行担当 | Secrets 投入後の担当者（実 Google Sheets API smoke は UT-26 で実施） |

## 実行ステップ

1. `bash scripts/cf.sh dev --config apps/api/wrangler.toml` で wrangler dev 起動
2. `/admin/sheets-auth-debug` 等のデバッグエンドポイントを叩く（または unit smoke を vitest で実行）
3. token 取得成功と Sheets API 200 を確認
4. log を redact し `manual-smoke-log.md` に保存
5. dev で OK 後、staging / production の secret 配置 (Phase 5 ステップ 5) を確認

## 結果

> 実 Google Sheets API smoke は UT-26 で記録する。本タスクでは unit / contract tests を実行証跡とする。

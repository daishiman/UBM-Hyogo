# UT-17 Phase 11: 視覚的検証スキップ宣言

## スキップ判定

| 項目 | 値 |
| --- | --- |
| タスク種別 | implementation / **NON_VISUAL** |
| UI/UX 実装 | なし |
| スクリーンショット必要性 | なし |

`index.md` の「タスク種別: implementation / NON_VISUAL」と整合し、本タスクは Cloudflare Workers backend / Slack 通知 relay のみで UI を持たないため、フェーズ 11（視覚的検証）はスキップする。

## 代替検証

UI が無い代わりに、Slack 通知ペイロードのフォーマット品質を以下で担保する:

- `apps/api/src/lib/__tests__/cloudflare-alert-formatter.test.ts`（11 ケース）で日本語ラベル / 数値整形 / リンク section / severity 判定を網羅。
- 実 Slack channel 到達確認は T8（staging deploy 後の curl）/ T10（production deploy 後の手動トリガー）で外部実施。

## 実 Slack 表示確認の手順（外部実施項目）

T8 完了後、staging Slack channel の表示を以下で目視確認:

- ヘッダー絵文字 ⚠️ / 🚨 と severity ラベルが日本語で表示される
- メトリクス名が日本語 (例: 「Workers リクエスト（1日）」) で表示される
- 「現在値」「閾値」「残量」フィールドが横並びで表示される
- 「Cloudflare Dashboard で確認」「対応手順 (runbook)」リンクが有効

これは Phase 12 の implementation-guide 内 PR チェックリスト項目として継承する。

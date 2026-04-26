# 未タスク検出レポート

## 検出された未タスク

### 未タスク 1: Cloudflare Secrets の実際の配置

| 項目 | 内容 |
| --- | --- |
| 内容 | staging/production への `GOOGLE_SERVICE_ACCOUNT_JSON` の実際の `wrangler secret put` 実行 |
| 理由 | 本番 Service Account JSON key はユーザーが 1Password から取得して手動実施が必要 |
| 影響範囲 | UT-09・03-serial の本番動作 |
| 推奨アクション | setup-runbook.md の手順 2 に従い、ユーザーがデプロイ前に実施する |

### 未タスク 2: 実際の Sheets API エンドツーエンド疎通確認

| 項目 | 内容 |
| --- | --- |
| 内容 | 実際の Service Account で Google Sheets API v4 への疎通確認（curl による実レスポンス確認） |
| 理由 | テストは fetch mock を使用しており、実 API の疎通は SA 設定後に実施が必要 |
| 推奨アクション | setup-runbook.md の手順 5 に従い、SA 設定後に実施する |

## 本タスクのスコープ外事項（意図的に含まない）

| 項目 | 理由 |
| --- | --- |
| Sheets データの読み書き実装 | UT-09 の責務 |
| D1 スキーマ設計 | UT-04 の責務 |
| Sheets→D1 同期ジョブ | UT-09・03-serial の責務 |
| Google Cloud Project 作成 | 01c-parallel-google-workspace-bootstrap 済み前提 |

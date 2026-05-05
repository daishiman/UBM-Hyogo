# Free-tier Estimation（無料枠運用試算）

> AC-11 根拠化

## 4 サービス試算

| サービス | 使用機能 | 課金有無 | 根拠 |
| --- | --- | --- | --- |
| Google Cloud | OAuth 2.0 client / OAuth consent screen / verification 申請 | **無料** | OAuth + Cloud Console 操作のみ。Cloud APIs / Compute / Storage 等の課金 product は有効化しない |
| Cloudflare Workers | `apps/api` / `apps/web` の Workers + bundled assets | **無料**（無料枠 100k req/day 以内） | Solo 開発時のリクエスト数は数百〜数千/日想定 |
| Cloudflare Secrets | `wrangler secret put` 経由の secret store | **無料** | Workers の付帯機能、追加課金なし |
| 1Password | 個人 vault の op CLI 利用 | 既存サブスク | 本タスクで追加コストなし |

## 結論

**追加コスト 0 円**。AC-11 は無料枠運用で達成可能。

## 監視対象

- Cloudflare Workers リクエスト数（無料枠 100k/日を超えないか月次確認）
- Google Cloud 課金請求（OAuth のみ使用なら $0 で推移する想定）

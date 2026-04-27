# Phase 12: Unassigned task detection

> 検出 0 件でも本ファイルは出力必須。

## 検出された未割り当てタスク

| 検出項目 | 種別 | 推奨対応 | 割り当て先 |
| --- | --- | --- | --- |
| KV namespace の実 ID 発行・1Password 登録 | 運用 | `wrangler kv:namespace create ubm-hyogo-kv-prod / -staging / -staging --preview` を実行し、出力された ID を 1Password Environments に保管 | `docs/30-workflows/unassigned-task/UT-30-kv-namespace-id-registration.md` |
| `apps/api/wrangler.toml` への KV バインディング追加実装 | 実装 | runbook の Step 3 に従い、`[env.staging.kv_namespaces]` / `[env.production.kv_namespaces]` セクションを追記 | `docs/30-workflows/unassigned-task/UT-31-api-wrangler-session-kv-binding.md` |
| Worker 側 KV read/write 実装（`isSessionBlacklisted` / `blacklistSession` / `getCachedConfig` ヘルパー） | 実装 | implementation-guide.md Part 2 のサンプル実装を `apps/api/src/lib/kv/` 等に配置 | `docs/30-workflows/unassigned-task/UT-32-worker-session-kv-helper-implementation.md` |
| ログアウト時の deny list 併用設計（D1 + KV 多層防御） | 設計 | KV 最終的一貫性を考慮し、D1 セッションテーブルの `revoked_at` と KV ブラックリストを併用する設計 | `docs/30-workflows/unassigned-task/UT-32-worker-session-kv-helper-implementation.md` |
| KV 無料枠 read/write 数の本番モニタリング | 運用 | Cloudflare Analytics で監視・閾値（write 70%/90%、read 70%）超過時アラート設定 | `docs/30-workflows/unassigned-task/UT-33-kv-usage-monitoring-alerts.md` |
| レートリミットの Durable Objects 移行検討（write 1k/日 枯渇予防） | 設計 | アクティブユーザー規模が無料枠を超える前に Durable Objects への移行可否を評価 | `docs/30-workflows/unassigned-task/UT-33-kv-usage-monitoring-alerts.md` |
| pre-commit hook で実 Namespace ID（32 桁 hex）混入を検出する仕組み | 運用 | リポジトリ全体で 32 桁 hex パターンを検出する pre-commit hook を整備 | `docs/30-workflows/unassigned-task/UT-34-kv-secret-leak-precommit-guard.md` |

## 検出件数

- 合計: 7 件
- 緊急: 0 件（本タスクのスコープ内では未解決のものなし）
- 中期: 5 件（下流の認証実装・運用タスクに委譲）
- 長期: 2 件（Durable Objects 移行・pre-commit hook 整備）

## 申し送り

すべての未割り当てタスクは「下流の認証実装タスク」または「運用タスク」に委譲可能。本タスク（UT-13）の AC-1〜AC-7 は全て docs-only 範囲で達成済みのため、本ファイルの検出項目はブロッカーではない。

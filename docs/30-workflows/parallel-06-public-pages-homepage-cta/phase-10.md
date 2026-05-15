# Phase 10: デプロイ / リリース準備

[実装区分: 実装仕様書]

| 項目 | 値 |
| --- | --- |
| Phase | 10 / 13 |
| 前 Phase | 9 |
| 次 Phase | 11 |
| 状態 | completed |

## 影響範囲

- Cloudflare Workers (apps/web): static markup の追加のみ。bundle size 微増（< 2KB 想定）。
- 環境変数 / Cloudflare Secrets 変更: なし
- D1 migration: なし
- Wrangler config 変更: なし

## デプロイ手順（dev → main 経路）

1. PR は `feature/* → dev` で作成（CLAUDE.md ブランチ戦略）
2. `dev` マージ後、Cloudflare staging への自動デプロイで確認
3. staging で `/` ページの FOR MEMBERS CTA セクションの目視確認
4. production リリース時のみ `dev → main` PR を別途作成

## ロールバック手順

- 単一コミット revert で完結（new component + 4 ファイル編集の最小差分）

## 完了条件

- デプロイ影響範囲が本ドキュメントの記載と一致
- ロールバック手順が単純 revert で機能する設計

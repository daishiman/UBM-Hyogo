# Phase 9: 品質保証 — main

## 検査
- typecheck: ✓ (`pnpm --filter @ubm-hyogo/api typecheck` 緑)
- vitest: ✓ 42 / 42 緑
- lint: 既存 boundary lint と互換（apps/web から D1 直接 import なし）

## 残課題（後続タスクで対応）
- dependency-cruiser 統合は 02c タスクで全体ルール導入時に実行
- miniflare 経由の本物 D1 統合テストは 08a タスクで実行
- `_shared/status-readonly.ts` の正式 helper 化は 02a 着手時に再構造化

詳細は free-tier.md / secret-hygiene.md。

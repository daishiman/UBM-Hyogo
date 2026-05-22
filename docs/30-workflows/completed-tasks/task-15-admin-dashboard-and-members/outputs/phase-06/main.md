# Phase 6: a11y / edge case 拡充

## 完了
- `jest-axe` / `@types/jest-axe` を `@ubm-hyogo/web` devDependency に追加
- 全 5 component test の `it.todo("a11y violations 0")` を実テストへ置換
  - KpiGrid
  - MembersFilters
  - MembersTable
  - RecentActionsTable
  - BulkActionBar
- Edge case: `items=[]` placeholder, `slices=undefined` placeholder, `isLoading` 表示, `disabled` 制御を Phase 4 RED で網羅

## 実行結果
- `pnpm -F @ubm-hyogo/web test`: 528 passed / 1 skipped

## 判定
- 機能要件側の edge case は実装済み
- a11y 自動検査は task-15 scope 内で実装済み

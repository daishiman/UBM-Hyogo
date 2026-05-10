# Phase 6: a11y / edge case 拡充

## 完了
- 全 5 component test に対し `it.todo("a11y violations 0")` を配置（KpiGrid / MembersFilters / MembersTable / RecentActionsTable / BulkActionBar）
- Edge case: `items=[]` placeholder, `slices=undefined` placeholder, `isLoading` 表示, `disabled` 制御を Phase 4 RED で網羅

## 残課題
- jest-axe 未導入。`packages/web` には現状 `vitest-axe` / `jest-axe` 依存なし
- 導入時は `pnpm -F @ubm-hyogo/web add -D jest-axe @types/jest-axe` → `setupTests.ts` に `expect.extend(toHaveNoViolations)` 追加 → 各 todo を `await axe(container)` で実装
- 本タスクスコープ外（task-09/10 ui-primitives layer の axe 導入と整合してから）

## 判定
- 機能要件側の edge case は実装済み
- a11y 自動検査は次タスクへ移管（DoD G-09 は手動 + role/aria 配置で担保）

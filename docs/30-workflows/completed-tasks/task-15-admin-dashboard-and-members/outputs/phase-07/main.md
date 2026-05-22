# Phase 7: テストカバレッジ確認

## 結果
- `pnpm -F @ubm-hyogo/web test`: **541 passed / 1 skipped / 5 todo (547 total)**
- task-15 追加テスト: 6 file / 26 case (1 file あたり 4-6 case + a11y todo)
  - `dashboard-ui.test.ts` 4 case
  - `KpiGrid.test.tsx` 5 case (1 todo)
  - `MembersFilters.test.tsx` 6 case (1 todo)
  - `MembersTable.test.tsx` 6 case (1 todo)
  - `RecentActionsTable.test.tsx` 4 case (1 todo)
  - `BulkActionBar.test.tsx` 5 case (1 todo)

## カバレッジ
- 機能カバレッジ: 主要 user flow（描画 / フィルタ / 選択 / 一括操作 / pagination / drawer 連携 / API mapper）を網羅
- 数値カバレッジ計測: `pnpm -F @ubm-hyogo/web test -- --coverage` は CI gate と同じ範囲で別タスク（既存 coverage gate）に委譲

## 判定
- TDD GREEN 達成。RED で書いた全 case が pass。

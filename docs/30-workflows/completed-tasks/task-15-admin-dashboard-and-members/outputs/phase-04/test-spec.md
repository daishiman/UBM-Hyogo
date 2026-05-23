# Phase 4 Test Spec

TDD Red 対象:

- `apps/web/src/features/admin/components/__tests__/KpiGrid.test.tsx`
- `apps/web/src/features/admin/components/__tests__/MembersFilters.test.tsx`
- `apps/web/src/features/admin/components/__tests__/MembersTable.test.tsx`
- `apps/web/src/features/admin/components/__tests__/RecentActionsTable.test.tsx`
- `apps/web/src/features/admin/components/__tests__/BulkActionBar.test.tsx`
- `apps/web/src/lib/admin/dashboard-ui.test.ts`

Red -> Green 後の現行証跡:

- `pnpm -F @ubm-hyogo/web test`: 528 passed / 1 skipped
- task-15 focused a11y todo は `jest-axe` 実テストへ置換済み

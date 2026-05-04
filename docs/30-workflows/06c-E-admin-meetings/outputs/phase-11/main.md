# Phase 11 Output: 手動 smoke / 実測 evidence

Status: PASS_BOUNDARY_SYNCED_RUNTIME_PENDING

Local focused test evidence は取得済み:

- `pnpm --filter @ubm-hyogo/api exec vitest run --root=../.. --config=vitest.config.ts apps/api/src/repository/attendance.test.ts apps/api/src/routes/admin/attendance.test.ts apps/api/src/routes/admin/meetings.test.ts apps/api/src/repository/meetings.test.ts` -> PASS (4 files / 37 tests)
- `pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/lib/admin/__tests__/api.test.ts apps/web/src/components/admin/__tests__/MeetingPanel.test.tsx` -> PASS (2 files / 21 tests)

Runtime visual / deployed smoke は admin session、D1 fixture、staging deploy が必要なため 08b / 09a または user-approved execution wave で取得する。未取得 runtime evidence を full PASS と扱わない。

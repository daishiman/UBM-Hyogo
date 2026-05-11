# Phase 5 Implementation Log

実装済み:

- `apps/web/app/(admin)/layout.tsx`
- `apps/web/app/(admin)/admin/page.tsx`
- `apps/web/app/(admin)/admin/members/page.tsx`
- `apps/web/src/features/admin/components/_layout/AdminPageHeader.tsx`
- `apps/web/src/features/admin/components/_dashboard/*`
- `apps/web/src/features/admin/components/_members/*`
- `apps/web/src/features/admin/components/index.ts`
- `apps/web/src/lib/admin/admin-dashboard-ui.ts`
- `apps/web/src/lib/admin/dashboard-ui.test.ts`
- `apps/web/playwright/fixtures/auth.ts`
- `apps/web/playwright/tests/task15-admin-screenshots.spec.ts`

境界:

- `apps/api` endpoint 追加なし
- `packages/shared` schema 変更なし
- web local mapper で `byZone` / `byStatus` optional 表示を吸収

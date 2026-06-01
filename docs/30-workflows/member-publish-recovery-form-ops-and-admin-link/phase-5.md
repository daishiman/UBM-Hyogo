# Phase 5: 実装（implemented local）

automation-30 準拠レビューで `implementation` workflow を spec-only に閉じる矛盾を検出したため、本 cycle で実コードと実仕様書へ反映した。

| Task | 主要ファイル |
|------|------------|
| A | `apps/web/src/features/admin/diagnostics/backfill.ts`, `apps/web/src/features/admin/components/_sync/BackfillPublishStatePanel.client.tsx`, `apps/web/app/(admin)/admin/sync-status/page.tsx` |
| B | `apps/web/src/features/admin/diagnostics/manual-sync.ts`, `apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx`, `apps/web/app/api/admin/[...path]/route.ts`, `apps/web/src/lib/env.ts` |
| C | `apps/web/src/components/public/ReflectionTimingNote.tsx`, `apps/web/app/(public)/members/page.tsx`, `apps/web/app/(member)/profile/page.tsx`, `docs/00-getting-started-manual/specs/03-data-fetching.md` |
| D | `apps/web/src/lib/constants/form.ts`, `apps/web/src/components/shell/{shell-config.ts,SidebarNavItem.tsx,icons.tsx}` |

## 検証

- `pnpm --filter @ubm-hyogo/web typecheck` PASS
- `pnpm exec vitest run apps/web/src/features/admin/components/_sync/__tests__/BackfillPublishStatePanel.spec.tsx apps/web/src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts apps/web/src/components/public/__tests__/ReflectionTimingNote.spec.tsx apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx apps/web/src/components/shell/__tests__/shell-config.spec.ts apps/web/src/lib/constants/__tests__/form-responses.spec.ts` PASS（7 files / 45 tests）

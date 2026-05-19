# Documentation Changelog

| Path | Update |
| --- | --- |
| `apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx` | Added SVG bar chart branch with token colors and fallback preservation |
| `apps/web/src/features/admin/components/_dashboard/StatusDistribution.spec.tsx` | Added focused render, a11y, token, scale, zero, and partial data tests |
| `apps/web/src/lib/admin/admin-dashboard-ui.ts` | Kept `byStatus` as loose unknown input after shared schema adds optional producer field |
| `apps/api/src/repository/dashboard.ts` | Added `byStatus` aggregation producer over D1 member rows |
| `apps/api/src/routes/admin/dashboard.ts` | Wired repository `byStatus` aggregation into existing `GET /admin/dashboard` response |
| `apps/api/src/routes/admin/dashboard.contract.spec.ts` | Extended contract spec to cover optional `byStatus` field shape |
| `packages/shared/src/zod/viewmodel.ts` | Added optional `byStatus` field to `AdminDashboardView` zod schema |
| `packages/shared/src/zod/viewmodel.spec.ts` | Added schema tests for optional `byStatus` presence / absence parity |
| `packages/shared/src/types/viewmodel/index.ts` | Added optional `byStatus` type to `AdminDashboardView` TS contract |
| `docs/30-workflows/step-05-dashboard-chart-implementation/` | Added artifacts, Phase 11 evidence, and Phase 12 strict 7 outputs |
| `.claude/skills/aiworkflow-requirements/references/ui-ux-admin-dashboard.md` | Synced admin dashboard status chart contract |

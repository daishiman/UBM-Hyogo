# Workflow Artifact Inventory — task-15 admin dashboard and members

| Field | Value |
| --- | --- |
| workflow root | `docs/30-workflows/task-15-admin-dashboard-and-members/` |
| state | `implemented-local-runtime-pending / implementation / VISUAL / Phase 13 blocked_pending_user_approval` |
| source spec | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/07-screens-admin/task-15-w5-par-admin-dashboard-and-members.md` |
| primary screens | `/admin`, `/admin/members` |
| implementation | `apps/web/app/(admin)/layout.tsx`, `apps/web/app/(admin)/admin/page.tsx`, `apps/web/app/(admin)/admin/members/page.tsx`, `apps/web/src/features/admin/components/**`, `apps/web/src/lib/admin/admin-dashboard-ui.ts` |
| tests | `apps/web/src/features/admin/components/__tests__/*.test.tsx`, `apps/web/src/lib/admin/dashboard-ui.test.ts`, `apps/web/playwright/tests/task15-admin-screenshots.spec.ts` |
| Phase 11 evidence | `docs/30-workflows/task-15-admin-dashboard-and-members/outputs/phase-11/` |
| Phase 12 evidence | `docs/30-workflows/task-15-admin-dashboard-and-members/outputs/phase-12/` |
| boundaries | no new admin API endpoint, no D1 schema change, no shared schema mutation |
| downstream | task-16, task-17, task-18 |

## Notes

`byZone` / `byStatus` are intentionally web-local optional UI slices. The current backend `GET /admin/dashboard` contract remains unchanged.

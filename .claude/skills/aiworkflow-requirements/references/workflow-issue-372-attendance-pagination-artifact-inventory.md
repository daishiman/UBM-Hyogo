# Artifact Inventory: issue-372-attendance-pagination

## Metadata

| Field | Value |
| --- | --- |
| Workflow | `docs/30-workflows/issue-372-attendance-pagination/` |
| State | `implemented-local / implementation / VISUAL / Phase 11 visual pending` |
| Parent issue | `https://github.com/daishiman/UBM-Hyogo/issues/372` |
| Source | `docs/30-workflows/completed-tasks/ut-02a-attendance-profile-integration/ut-02a-followup-004-attendance-pagination.md` |
| Sync date | 2026-05-06 |

## Current Canonical Set

| Layer | Path | Role |
| --- | --- | --- |
| workflow root | `docs/30-workflows/issue-372-attendance-pagination/` | Phase 1-13 implementation specification |
| phase 12 evidence | `docs/30-workflows/issue-372-attendance-pagination/outputs/phase-12/` | strict 7 files + cursor runbook |
| repository target | `apps/api/src/repository/attendance.ts` | implemented `findByMemberId(id, opts?)` cursor pagination |
| builder target | `apps/api/src/repository/_shared/builder.ts` | implemented encoded cursor deps + `attendanceMeta` injection |
| route target | `apps/api/src/routes/me/index.ts`, `apps/api/src/routes/admin/members.ts` | implemented `/me/attendance` and admin attendance endpoint |
| shared target | `packages/shared/src/types/viewmodel/index.ts`, `packages/shared/src/zod/viewmodel.ts` | implemented optional `attendanceMeta` |
| web target | `apps/web/app/profile/_components/AttendanceList.tsx`, `apps/web/src/components/admin/MemberDrawer.tsx` | implemented load-more UI |

## Boundary

Current API specs are updated in `docs/00-getting-started-manual/specs/01-api-schema.md` and `references/api-endpoints.md`. Phase 11 staging screenshots / curl evidence are pending runtime access. `findByMemberIds(ids)` bulk pagination is explicit scope-out, not an unassigned task.

# Task Breakdown

| Task | Responsibility | Files | Status |
| --- | --- | --- | --- |
| T1 | Confirm existing paths and tags target contract | `AdminSidebar.tsx`, `MemberDrawer.tsx`, `admin/tags/page.tsx` | completed |
| T2 | Add sidebar home link | `apps/web/src/components/layout/AdminSidebar.tsx` | completed |
| T3 | Add drawer tag-management link | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | completed |
| T4 | Add/update component tests | `AdminSidebar.component.spec.tsx`, `MemberDrawer.spec.tsx` | completed |
| T5 | Capture visual evidence | Phase 11 DOM fallback + mock screenshots; real screenshots runtime pending | runtime_pending |

## Dependency Notes

T2 and T3 were independent after T1. T4 depended on T2/T3. T5 depends on test pass plus an authenticated/mockable admin runtime; fallback evidence is captured for this local cycle.

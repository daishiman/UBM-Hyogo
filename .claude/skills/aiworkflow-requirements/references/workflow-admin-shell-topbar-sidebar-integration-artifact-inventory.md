# workflow-admin-shell-topbar-sidebar-integration artifact inventory

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-shell-topbar-sidebar-integration/` |
| root artifacts | `docs/30-workflows/completed-tasks/admin-shell-topbar-sidebar-integration/artifacts.json` |
| output artifacts | `docs/30-workflows/completed-tasks/admin-shell-topbar-sidebar-integration/outputs/artifacts.json` |
| source task | `docs/30-workflows/admin-ui-prototype-alignment/tasks/task-A-admin-shell-integration.md` |
| parent workflow | `docs/30-workflows/admin-ui-prototype-alignment/` |
| Phase 11 evidence | `docs/30-workflows/completed-tasks/admin-shell-topbar-sidebar-integration/outputs/phase-11/manual-test-result.md` |
| Phase 11 screenshots | `docs/30-workflows/completed-tasks/admin-shell-topbar-sidebar-integration/outputs/phase-11/task-A-sidebar-desktop-1280.png`, `task-A-sidebar-desktop-1280-members-active.png`, `task-A-sidebar-tablet-768.png`, `task-A-sidebar-mobile-375.png`, `task-A-sidebar-schema-badge.png`, `task-A-topbar-removed-1280.png` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/admin-shell-topbar-sidebar-integration/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| Phase 13 PR placeholder | `docs/30-workflows/completed-tasks/admin-shell-topbar-sidebar-integration/outputs/phase-13/pr-creation-result.md` |
| implementation targets | `apps/web/app/(admin)/layout.tsx`, `apps/web/src/components/layout/AdminSidebar.tsx`, `apps/web/src/components/layout/AdminSidebarNavItem.tsx`, `apps/web/src/components/layout/AdminBrandBlock.tsx`, `apps/web/src/components/layout/isActive.ts`, `apps/web/src/lib/admin/server-fetch.ts` |
| expected specs | `apps/web/app/(admin)/layout.spec.tsx`, `apps/web/src/components/layout/__tests__/AdminSidebar.spec.tsx`, `AdminSidebarNavItem.spec.tsx`, `isActive.spec.ts`, `apps/web/playwright/tests/admin-shell-topbar-sidebar-integration.spec.ts` |

## Contract

`admin-shell-topbar-sidebar-integration` is registered as
`implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION`.

It supersedes the slot-era #894/#895 topbar contract for this parent workflow:
breadcrumb/title/actions ownership belongs to page-local `AdminPageHeader`, while
the admin shell owns layout, sidebar, auth gate, and schema-diff badge data flow.
No new API endpoint or D1 schema is introduced.

Local implementation and local authenticated Playwright fixture screenshots are complete.
Staging visual baseline, commit, push, and PR are user-gated.

## Lessons Learned

- [[lessons-learned-admin-shell-topbar-sidebar-integration-2026-05]] — L-ASHELL-001..005: shell header 撤去契約 / Server layout × Client sidebar 境界 / `isActive` 純関数 (`/`・`/admin` exact-match) / schema diff badge を既存 endpoint derive / VISUAL_ON_EXECUTION の Phase 11 fixture を同一 wave で確定。

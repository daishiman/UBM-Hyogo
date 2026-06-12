# Workflow artifact inventory: admin-sidebar-collapse-layout-fix

## Summary

| Field | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-sidebar-collapse-layout-fix/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL` |
| purpose | collapsed sidebar の brand / nav item / user menu / admin return を中央軸へ揃え、expanded regression を防ぐ |
| user gate | staging authenticated visual baseline, commit, push, PR |

## Implementation

| Area | Files |
| --- | --- |
| shell components | `apps/web/src/components/shell/SidebarBrand.tsx`, `SidebarNavGroup.tsx`, `SidebarNavItem.tsx`, `SidebarShell.tsx`, `SidebarUserMenu.tsx` |
| focused tests | `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx`, `SidebarUserMenu.spec.tsx`, `SidebarShell.spec.tsx` |
| workflow evidence | `docs/30-workflows/completed-tasks/admin-sidebar-collapse-layout-fix/outputs/phase-11/manual-test-result.md`, `outputs/phase-11/screenshots/*.png`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## Evidence

| Check | Result |
| --- | --- |
| focused Vitest | `SidebarNavItem.spec.tsx` / `SidebarUserMenu.spec.tsx` / `SidebarShell.spec.tsx`: 3 files / 30 tests PASS |
| local visual | Playwright Chromium localhost screenshot 3 PNG present: collapsed desktop, expanded desktop, collapsed user-menu open |
| layout measurement | collapsed rows have `px-0`; icon center vs aside center is 0-1px delta after `SidebarNavGroup` list reset |
| API/D1/Form | unchanged; `apps/api` diff empty |
| Browser plugin boundary | in-app Browser `iab` unavailable; Playwright Chromium fallback used for local visual evidence |

## Lessons Learned

| ID | Lesson |
| --- | --- |
| L-ASCL-001 | collapsed sidebar alignment must reset both component padding and browser default list padding. `px-0 w-full justify-center` alone leaves `ul` default `padding-left: 20px` able to collapse nav item width and shift icon center. |
| L-ASCL-002 | Element-only screenshots can clip popovers that intentionally escape the sidebar. Use viewport screenshot for popover-open evidence while keeping collapsed/expanded sidebar screenshots element-scoped. |

## Follow-up relationship

`admin-sidebar-collapsed-icon-spacing-parity` is a later refinement, not a duplicate. This inventory fixed the collapsed center axis and list padding. The follow-up keeps that center axis while shrinking only nav/public-return icon-box height from `h-10` to `h-[18px]`; brand mark and user avatar keep their intentional `h-10 w-10` boxes.

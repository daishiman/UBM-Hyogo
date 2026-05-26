# Workflow Artifact Inventory: Issue #895 AdminTopbar Actions Client Island

| Artifact | Path | Status |
| --- | --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-895-admin-topbar-actions-client-island/` | present |
| root artifacts | `docs/30-workflows/completed-tasks/issue-895-admin-topbar-actions-client-island/artifacts.json` | present |
| output artifacts | `docs/30-workflows/completed-tasks/issue-895-admin-topbar-actions-client-island/outputs/artifacts.json` | present |
| phase 11 evidence | `docs/30-workflows/completed-tasks/issue-895-admin-topbar-actions-client-island/outputs/phase-11/manual-test-result.md` | present |
| phase 12 compliance | `docs/30-workflows/completed-tasks/issue-895-admin-topbar-actions-client-island/outputs/phase-12/phase12-task-spec-compliance-check.md` | present |
| implementation | `apps/web/src/features/admin/components/_layout/AdminTopbarActions.tsx` | present |
| component spec | `apps/web/src/features/admin/components/_layout/__tests__/AdminTopbarActions.spec.tsx` | present |
| layout integration | `apps/web/app/(admin)/layout.tsx` | present |
| layout spec | `apps/web/app/(admin)/layout.spec.tsx` | present |
| source one-pager | `docs/30-workflows/completed-tasks/parallel-03-followup-004-admin-topbar-actions-buttons.md` | consumed |

## Contract

`AdminTopbarActions` owns global admin shell actions only. Page-specific actions remain in `AdminPageHeader.actions`. `AdminTopbar` and `(admin)/layout.tsx` remain server components; client behavior is isolated to the small actions island.

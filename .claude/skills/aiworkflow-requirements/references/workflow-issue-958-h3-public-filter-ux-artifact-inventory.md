# workflow-issue-958-h3-public-filter-ux artifact inventory

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-958-h3-public-filter-ux/` |
| root artifacts | `docs/30-workflows/completed-tasks/issue-958-h3-public-filter-ux/artifacts.json` |
| output artifacts mirror | `docs/30-workflows/completed-tasks/issue-958-h3-public-filter-ux/outputs/artifacts.json` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/issue-958-h3-public-filter-ux/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| Phase 12 strict outputs | `docs/30-workflows/completed-tasks/issue-958-h3-public-filter-ux/outputs/phase-12/` |
| source unassigned task | `docs/30-workflows/unassigned-task/google-form-reflection-diagnostics-followup-003-h3-public-filter-ux.md` |
| parent workflow | `docs/30-workflows/completed-tasks/google-form-reflection-diagnostics/` |
| issue | `#958` CLOSED, `Refs #958` only |

## Classification

`implemented_local_runtime_pending / implementation / VISUAL / focused tests passed / local static visual present / staging visual pending`

## Local Implementation Targets

- `apps/web/app/(member)/profile/_components/PublicConsentCallout.tsx`
- `apps/web/app/(member)/profile/page.tsx`
- `apps/web/src/components/admin/BulkRepublishDrawer.tsx`
- `apps/web/src/features/admin/hooks/useBulkRepublish.ts`
- `apps/web/src/features/admin/components/_members/MembersClientShell.tsx`
- `apps/web/src/components/public/AllHiddenFallback.tsx`
- `apps/web/app/(public)/members/page.tsx`

## Screenshot Boundary

10 local static screenshots are saved under `docs/30-workflows/completed-tasks/issue-958-h3-public-filter-ux/outputs/phase-11/screenshots/`; metadata is saved at `outputs/phase-11/metadata.json`. Staging runtime screenshots remain pending.

## Boundary

This wave includes local app implementation and canonical specification / skill synchronization. Focused local tests passed (4 files / 11 tests), web typecheck/lint passed, and local static Phase 11 screenshots are present. Staging verification, commit, push, and PR are user-gated or pending and are not claimed as PASS.

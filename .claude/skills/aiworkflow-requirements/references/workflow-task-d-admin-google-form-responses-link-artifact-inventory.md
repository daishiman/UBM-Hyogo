# Workflow Artifact Inventory: task-d-admin-google-form-responses-link

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/task-d-admin-google-form-responses-link/` |
| root artifacts | `docs/30-workflows/completed-tasks/task-d-admin-google-form-responses-link/artifacts.json` |
| output artifacts mirror | `docs/30-workflows/completed-tasks/task-d-admin-google-form-responses-link/outputs/artifacts.json` |
| Phase 1 requirements | `docs/30-workflows/completed-tasks/task-d-admin-google-form-responses-link/outputs/phase-1/requirements.md` |
| Phase 11 evidence | `docs/30-workflows/completed-tasks/task-d-admin-google-form-responses-link/outputs/phase-11/main.md` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/task-d-admin-google-form-responses-link/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| parent workflow | `docs/30-workflows/member-publish-recovery-form-ops-and-admin-link/` |
| implementation targets | `apps/web/src/lib/constants/form.ts`, `apps/web/src/components/shell/shell-config.ts`, `apps/web/src/components/shell/icons.tsx`, `apps/web/src/components/shell/SidebarNavItem.tsx` |
| tests | `apps/web/src/lib/constants/__tests__/form-responses.spec.ts`, `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx`, `apps/web/src/components/shell/__tests__/shell-config.spec.ts` |
| system specs | `docs/00-getting-started-manual/specs/09h-shell-and-fixtures.md`, `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` |

## Status

`implemented_local_evidence_captured / implementation / VISUAL`.

The apps implementation was already landed through parent PR #1064 / commit `745c95115`.
This workflow is the canonical verification record for Task D and does not introduce a new
`apps/web` diff in this wave.

Local primary evidence is the focused jsdom / pure-function / constant test set. Staging
admin screenshots and the external Google Form tab observation are user-gated because they
require authenticated admin runtime access.

## Contract

- Admin role nav includes PUBLIC 3 + MEMBERS 1 + ADMIN 10 = 14 total items.
- The `Form回答` item uses `FORM_RESPONSES_EDIT_URL` from `apps/web/src/lib/constants/form.ts`.
- `ShellNavItem.external?` switches the item from internal `Link` rendering to
  `<a target="_blank" rel="noopener noreferrer">`.
- External nav items must not receive `aria-current` or `data-active`.
- External nav items announce the boundary with a visible `↗` marker and sr-only
  `（外部リンク）`.
- `ShellNavItemId` / icon keys stay exhaustive through `Record<ShellNavItemId, string>`.

## Lessons Learned

- **L-TDGF-001**: VISUAL tasks behind admin authentication can close local Phase 11 with two-tier evidence: local DOM/config tests as `present`, authenticated screenshot as `pending / user-gated`.
- **L-TDGF-002**: External sidebar nav should be represented as data (`external?: boolean`) instead of a separate one-off component so spacing, icon, collapsed, and badge behavior remain shared.
- **L-TDGF-003**: External nav active state must be negative-tested; an external Google URL can never be the current app route.

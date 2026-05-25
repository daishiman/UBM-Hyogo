# workflow-admin-ui-prototype-alignment-followup-002-section-error-retry artifact inventory

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-ui-prototype-alignment-followup-002-section-error-retry/` |
| root artifacts | `docs/30-workflows/completed-tasks/admin-ui-prototype-alignment-followup-002-section-error-retry/artifacts.json` |
| output artifacts | `docs/30-workflows/completed-tasks/admin-ui-prototype-alignment-followup-002-section-error-retry/outputs/artifacts.json` |
| Phase 11 main | `docs/30-workflows/completed-tasks/admin-ui-prototype-alignment-followup-002-section-error-retry/outputs/phase-11/main.md` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/admin-ui-prototype-alignment-followup-002-section-error-retry/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| source unassigned task | `docs/30-workflows/completed-tasks/unassigned-task/admin-ui-prototype-alignment-followup-002-admin-section-error-retry-cta.md` |
| parent workflow | `docs/30-workflows/admin-ui-prototype-alignment/` |
| primary component | `apps/web/src/features/admin/components/_shared/AdminSectionError.tsx` |
| client wrapper | `apps/web/src/features/admin/components/_shared/AdminSectionErrorClient.tsx` |

## Contract

`admin-ui-prototype-alignment-followup-002-section-error-retry` is registered as
`implementation_reviewed / implementation / NON_VISUAL`.

The workflow formalizes Issue #881 as a closed-issue follow-up using `Refs #881`
only. The implementation keeps `AdminSectionError` server compatible, adds a
minimal `AdminSectionErrorClient` boundary for `router.refresh()` retry, and
forbids adding `"use client"` to admin page server components.

Local evidence capture passed for focused Vitest, `jest-axe`,
root lint/typecheck, design-token, and client-boundary grep gates. Commit, push,
and PR are user-gated.

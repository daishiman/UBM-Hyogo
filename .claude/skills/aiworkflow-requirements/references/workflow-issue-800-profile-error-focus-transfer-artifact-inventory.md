# Workflow Artifact Inventory — issue-800-profile-error-focus-transfer

| Artifact | Path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-800-profile-error-focus-transfer/` |
| root artifacts | `docs/30-workflows/completed-tasks/issue-800-profile-error-focus-transfer/artifacts.json` |
| shared focus hook | `apps/web/src/lib/a11y/useAutoFocusOnMount.ts` |
| hook focused test | `apps/web/src/lib/a11y/__tests__/useAutoFocusOnMount.spec.tsx` |
| root implementation refactor | `apps/web/app/error.tsx` |
| profile implementation | `apps/web/app/profile/error.tsx` |
| profile focused test | `apps/web/app/profile/__tests__/error.component.spec.tsx` |
| login implementation | `apps/web/app/login/error.tsx` |
| login focused test | `apps/web/app/login/__tests__/error.component.spec.tsx` |
| admin implementation | `apps/web/app/(admin)/admin/error.tsx` |
| admin focused test | `apps/web/app/(admin)/admin/__tests__/error.component.spec.tsx` |
| Phase 11 evidence | `docs/30-workflows/completed-tasks/issue-800-profile-error-focus-transfer/outputs/phase-11/evidence/` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/issue-800-profile-error-focus-transfer/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| source follow-up task | `docs/30-workflows/completed-tasks/issue-769-followup-002-profile-error-focus-transfer.md` |
| source parent workflow | `docs/30-workflows/completed-tasks/issue-769-root-error-focus/` |
| umbrella parent workflow | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/` |

## State

`implemented_local_evidence_captured / implementation / NON_VISUAL / implementation_complete_pending_pr`

Issue #800 is CLOSED; PR text must use `Refs #800` only. Commit, push, PR, and manual screen reader smoke remain user-gated.

## useAutoFocusOnMount hook

Shared a11y focus transfer hook in `apps/web/src/lib/a11y/`. Auto focus on mount with preventScroll default. Used by every error boundary.

## Error focus management pattern

Unified error boundary structure: role alert, aria live assertive, tabIndex minus one heading, auto focus on mount, logger error with digest. Applied across root, profile, login, admin error boundaries.

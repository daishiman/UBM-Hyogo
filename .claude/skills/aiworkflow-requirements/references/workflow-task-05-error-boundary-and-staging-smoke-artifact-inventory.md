# Workflow Artifact Inventory: task-05 error boundary and staging smoke

| Item | Path | State |
| --- | --- | --- |
| workflow root | `docs/30-workflows/task-05-error-boundary-and-staging-smoke/` | `implemented-local / implementation / runtime evidence pending_user_approval / VISUAL_ON_EXECUTION` |
| root artifacts | `docs/30-workflows/task-05-error-boundary-and-staging-smoke/artifacts.json` | root ledger |
| artifacts mirror | `docs/30-workflows/task-05-error-boundary-and-staging-smoke/outputs/artifacts.json` | must match root by `cmp -s` |
| route source of truth | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/specs/staging-smoke-checklist.md` | 19 routes |
| Phase 12 strict files | `docs/30-workflows/task-05-error-boundary-and-staging-smoke/outputs/phase-12/` | present |
| implementation targets | `apps/web/app/{error,global-error,not-found,loading}.tsx` | implemented-local |
| test targets | `apps/web/tests/e2e/staging-smoke.spec.ts`, `apps/web/app/__tests__/error.component.spec.tsx` | implemented-local |

## Boundary

Local code implementation and local verification are complete. Staging deploy, Playwright runtime smoke against the deployed staging URL, Sentry dashboard verification, commit, push, and PR remain user-gated.

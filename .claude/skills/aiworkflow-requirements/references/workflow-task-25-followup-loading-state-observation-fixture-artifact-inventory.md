# Workflow Artifact Inventory — task-25 follow-up loading state observation fixture

## Current Status

| Field | Value |
| --- | --- |
| workflow root | `docs/30-workflows/task-25-followup-loading-state-observation-fixture/` |
| status | `verified / implementation / NON_VISUAL / implementation_complete_pending_pr` |
| parent workflow | `docs/30-workflows/completed-tasks/task-25-ui-mvp-w8-par-routes-smoke-coverage/` |
| source unassigned | `docs/30-workflows/completed-tasks/unassigned-task/task-25-followup-loading-state-observation-fixture.md` |
| final deliverable | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` |

## Artifact Set

| Artifact | Path |
| --- | --- |
| root ledger | `docs/30-workflows/task-25-followup-loading-state-observation-fixture/artifacts.json` |
| output ledger mirror | `docs/30-workflows/task-25-followup-loading-state-observation-fixture/outputs/artifacts.json` |
| Phase 11 evidence | `docs/30-workflows/task-25-followup-loading-state-observation-fixture/outputs/phase-11/evidence.md` |
| Phase 12 strict 7 | `docs/30-workflows/task-25-followup-loading-state-observation-fixture/outputs/phase-12/` |
| fixture guard | `apps/web/app/__smoke__/_lib/fixture-guard.ts` |
| fixture guard test | `apps/web/app/__smoke__/_lib/fixture-guard.spec.ts` |
| error fixture source | `apps/web/app/__smoke__/error-boundary/page.tsx` |
| members-list fixture source | `apps/web/app/__smoke__/members-list/page.tsx` |
| loading fixture page | `apps/web/app/__smoke__/loading-state/page.tsx` |
| loading fallback | `apps/web/app/__smoke__/loading-state/loading.tsx` |
| routable loading fixture page | `apps/web/app/smoke/loading-state/page.tsx` |
| routable loading fallback | `apps/web/app/smoke/loading-state/loading.tsx` |
| routable error fixture wrapper | `apps/web/app/smoke/error-boundary/page.tsx` |
| routable members-list fixture wrapper | `apps/web/app/smoke/members-list/page.tsx` |
| smoke tests | `apps/web/tests/e2e/staging-smoke.spec.ts` |
| UI/UX system spec | `docs/00-getting-started-manual/specs/09-ui-ux.md` |

## Boundary

The fixture is test-only by env guard. It does not change public API, D1 schema, auth, or production runtime behavior. Staging runtime smoke, CI evidence, commit, push, and PR remain user-gated.

# 2026-05-15 task-parallel-07 auth-and-shared spec sync

Synchronized `docs/30-workflows/task-parallel-07-auth-and-shared/` as `implemented_local_runtime_pending / implementation / VISUAL`.

## Scope

- `/login` loading/error UX hardening.
- Root error/loading and `/profile` loading skeleton alignment.
- `not-found.tsx` branded fallback verification.
- No API, D1, Auth.js flow, environment variable, or token-definition change.

## Evidence

- Phase 1-13 specification files exist.
- Local implementation files exist under `apps/web/app/{login,error,profile}` plus the local visual harness.
- Focused component specs include axe checks for login/root/profile loading and error states.
- Phase 11 screenshot evidence exists under `outputs/phase-11/`.
- Phase 12 strict 7 outputs exist under `outputs/phase-12/`.
- `phase12-task-spec-compliance-check.md` records `implemented_local_runtime_pending` and does not claim staging/runtime PASS.

## Ledger Updates

- `indexes/resource-map.md`
- `indexes/quick-reference.md`
- `references/task-workflow-active.md`

Staging smoke, broad task-18 visual regression, commit, push, and PR remain user-gated.

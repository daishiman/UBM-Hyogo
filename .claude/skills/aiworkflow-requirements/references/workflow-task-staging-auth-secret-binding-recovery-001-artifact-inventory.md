# workflow-task-staging-auth-secret-binding-recovery-001 artifact inventory

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/task-staging-auth-secret-binding-recovery-001/` |
| root artifacts | `docs/30-workflows/task-staging-auth-secret-binding-recovery-001/artifacts.json` |
| output artifacts | `docs/30-workflows/task-staging-auth-secret-binding-recovery-001/outputs/artifacts.json` |
| Phase 11 inventory | `docs/30-workflows/task-staging-auth-secret-binding-recovery-001/phase-11.md` |
| Phase 12 compliance | `docs/30-workflows/task-staging-auth-secret-binding-recovery-001/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| middleware | `apps/api/src/middleware/require-admin.ts` |
| API env contract | `apps/api/src/env.ts` |
| runtime smoke runner | `scripts/smoke/runtime-attendance-provider.sh` |
| cf wrapper | `scripts/cf.sh` |
| tests | `apps/api/src/middleware/require-admin.authz.spec.ts`, `apps/api/src/env.spec.ts`, `scripts/smoke/__tests__/runtime-attendance-provider.test.sh`, `scripts/__tests__/cf-sh-secret-put.test.sh` |
| source lesson | `docs/30-workflows/completed-tasks/task-runtime-smoke-admin-members-500-recovery-001/outputs/lessons-learned-auth-secret-true-cause.md` |

## Contract

The workflow is `implemented_local_runtime_pending / implementation / NON_VISUAL`.
Local prevention and diagnostic changes are complete. Staging/prod secret
reinjection, backend-ci rerun, commit, push, and PR are user-gated.


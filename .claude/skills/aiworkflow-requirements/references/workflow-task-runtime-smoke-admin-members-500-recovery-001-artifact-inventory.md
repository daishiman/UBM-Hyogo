# workflow-task-runtime-smoke-admin-members-500-recovery-001 artifact inventory

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/task-runtime-smoke-admin-members-500-recovery-001/` |
| root artifacts | `docs/30-workflows/task-runtime-smoke-admin-members-500-recovery-001/artifacts.json` |
| output artifacts | `docs/30-workflows/task-runtime-smoke-admin-members-500-recovery-001/outputs/artifacts.json` |
| Phase 11 inventory | `docs/30-workflows/task-runtime-smoke-admin-members-500-recovery-001/phase-11.md` |
| Phase 12 compliance | `docs/30-workflows/task-runtime-smoke-admin-members-500-recovery-001/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| smoke runner | `scripts/smoke/runtime-attendance-provider.sh` |
| smoke runner test | `scripts/smoke/__tests__/runtime-attendance-provider.test.sh` |
| admin members route | `apps/api/src/routes/admin/members.ts` |
| admin members contract test | `apps/api/src/routes/admin/members.contract.spec.ts` |
| API contract | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` |
| lesson | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-task-runtime-smoke-admin-members-500-recovery-001-2026-05.md` |

## Contract

This workflow recovers staging runtime smoke failure
`admin-list http=500 contract=.members | type == "array"`.

The current cycle is `runtime_pending / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`:
local defensive recovery and deterministic tests are complete, while staging
RCA, deploy, backend-ci rerun, commit, push, and PR are user-gated. The local
implementation covers admin members enum/error hardening and redacted non-200
response body persistence in `runtime-smoke.log`.

# Workflow Artifact Inventory: Issue #533 Public Profile Attendance Injection

## Workflow

| Item | Path |
| --- | --- |
| canonical root | `docs/30-workflows/completed-tasks/issue-533-public-profile-builder-attendance-injection/` |
| index | `docs/30-workflows/completed-tasks/issue-533-public-profile-builder-attendance-injection/index.md` |
| root artifacts | `docs/30-workflows/completed-tasks/issue-533-public-profile-builder-attendance-injection/artifacts.json` |
| output artifacts | `docs/30-workflows/completed-tasks/issue-533-public-profile-builder-attendance-injection/outputs/artifacts.json` |
| Phase 11 evidence | `docs/30-workflows/completed-tasks/issue-533-public-profile-builder-attendance-injection/outputs/phase-11/` |
| Phase 12 strict outputs | `docs/30-workflows/completed-tasks/issue-533-public-profile-builder-attendance-injection/outputs/phase-12/` |
| source stub consumed | `docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/unassigned-task/public-profile-builder-attendance-injection.md` |

## Implementation Sources

| Area | Path |
| --- | --- |
| shared type | `packages/shared/src/types/viewmodel/index.ts` |
| shared zod | `packages/shared/src/zod/viewmodel.ts` |
| shared zod test | `packages/shared/src/zod/viewmodel.test.ts` |
| repository builder | `apps/api/src/repository/_shared/builder.ts` |
| public route | `apps/api/src/routes/public/member-profile.ts` |
| public router typing | `apps/api/src/routes/public/index.ts` |
| public use-case | `apps/api/src/use-cases/public/get-public-member-profile.ts` |
| public view model | `apps/api/src/view-models/public/public-member-profile-view.ts` |
| public D1 helper | `apps/api/src/use-cases/public/__tests__/helpers/public-d1.ts` |
| route tests | `apps/api/src/routes/public/index.test.ts` |
| builder tests | `apps/api/src/repository/__tests__/builder.test.ts` |
| use-case tests | `apps/api/src/use-cases/public/__tests__/get-public-member-profile.test.ts` |

## System Spec Reflection

| Area | Path |
| --- | --- |
| manual API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` |
| api endpoint reference | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` |
| quick reference | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` |
| resource map | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` |
| active workflow inventory | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` |
| changelog | `.claude/skills/aiworkflow-requirements/changelog/20260508-issue533-public-profile-attendance.md` |
| logs | `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` |

## Scope Notes

- Status: `verified / implementation / NON_VISUAL / implementation_complete_pending_pr`.
- Issue #533 is CLOSED and must remain referenced as `Refs #533`.
- The Issue #371 nested unassigned source stub is consumed by this workflow and must not be selected as open work.
- Public web UI attendance rendering is outside this workflow. If required later, it needs a VISUAL task and screenshot evidence.
- Unrelated worktree deletions under Issue #503 and task-02-w2 are not part of this inventory.

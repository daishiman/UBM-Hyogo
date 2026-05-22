# Phase 12: System Spec Update Summary

## Updated

| File | Change |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Added active workflow entry for this runtime smoke recovery |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Added quick lookup for the workflow and recovery boundary |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | Added workflow root, strict outputs, implementation target, and user-gated evidence mapping |
| `.claude/skills/aiworkflow-requirements/references/workflow-task-runtime-smoke-admin-members-500-recovery-001-artifact-inventory.md` | Added artifact inventory |
| `.claude/skills/aiworkflow-requirements/changelog/20260521-task-runtime-smoke-admin-members-500-recovery-001.md` | Added same-wave changelog |
| `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-task-runtime-smoke-admin-members-500-recovery-001-2026-05.md` | Added diagnostic recovery lesson |
| `.claude/skills/task-specification-creator/references/phase12-skill-feedback-promotion.md` | Added runtime smoke recovery body-visibility rule |
| `apps/api/src/routes/admin/members.ts` | Added defensive enum normalization, legacy publish-state mapping, structured recovery code, and DB binding 503 guard |
| `apps/api/src/routes/admin/members.contract.spec.ts` | Added recovery contract coverage for DB binding absence, enum drift, legacy publish states, consent drift, and zod safe error |
| `scripts/smoke/runtime-attendance-provider.sh` | Persist redacted non-200 body in runtime smoke log |
| `scripts/smoke/__tests__/runtime-attendance-provider.test.sh` | Added T-4-5 regression test for admin-list body persistence and redaction |

## N/A

`docs/00-getting-started-manual/specs/01-api-schema.md` is unchanged because
`AdminMemberListView` response contract is unchanged in this cycle.

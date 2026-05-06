# System spec update summary

## Updated

| File | Update |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Issue #379 workflow registered as current local verification close-out. |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | Reverse lookup row added for Issue #379 schemaDiffQueue fakeD1 compat verification. |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | D1 repository quick reference amended with Issue #379 current GREEN note. |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-379-schema-diff-current-green-2026-05.md` | Captured stale-current verification lessons. |
| `docs/30-workflows/unassigned-task/task-schema-diff-queue-faked1-compat-001.md` | Original unassigned task marked consumed by current verification. |
| `.claude/skills/task-specification-creator/references/*` | Stale-current no-code verification branch promoted from skill feedback. |

## Not updated

| File | Reason |
| --- | --- |
| `apps/api/src/repository/schemaDiffQueue.ts` | Focused contract test is already GREEN. |
| `apps/api/src/repository/schemaDiffQueue.test.ts` | Existing 7-case contract remains valid. |
| `apps/api/src/repository/_shared/__fakes__/fakeD1.ts` | No failing contract justifies parser expansion. |

## Decision

The system spec records this as a stale failure close-out, not a new code fix.

# System spec update summary

## Required sync targets

- `.claude/skills/aiworkflow-requirements/references/legacy-ordinal-family-register.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- 09a / 09b / 09c workflow references to 08a
- `docs/30-workflows/unassigned-task/task-08a-canonical-workflow-tree-restore-001.md`

## Current close-out boundary

The execution wave completed the A-restore decision without changing application code. `aiworkflow-requirements` already carried the restored 08a canonical path as current/partial; this wave adds issue-346 as the trace workflow and records that `pnpm indexes:rebuild` produced drift 0. The workflow root remains `spec_created` because Phase 13 commit / push / PR is still pending user approval.

## Evidence state

| Evidence | Status |
| --- | --- |
| `file-existence.log` | PASS: canonical root exists |
| `verify-indexes.log` | PASS: `pnpm indexes:rebuild` executed; Issue #346 resource-map row is an intentional index update |
| `markdown-link-check.log` | PASS: targeted check, full checker not configured |
| screenshots | N/A: docs-only / NON_VISUAL |

## No application code impact

No `apps/api` or `apps/web` code path is changed by this task spec.

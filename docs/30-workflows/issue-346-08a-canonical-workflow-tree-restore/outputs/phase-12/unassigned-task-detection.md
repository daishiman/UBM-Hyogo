# Unassigned task detection

## Result

No new unassigned task is created by this specification wave for the 08a scope.

## Existing source task

This workflow formalizes `docs/30-workflows/unassigned-task/task-08a-canonical-workflow-tree-restore-001.md`. After Phase 13 approval, the source unassigned-task md is preserved as a formalization trace until promoted to `completed-tasks/`.

## Out-of-scope drift discovered

The 08a restore audit incidentally observed that `task-workflow-active.md` registers the following entries at top-level paths whose physical directories do not currently exist on this branch:

| Registered path | Physical state |
| --- | --- |
| `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/` | absent |
| `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/` | absent |

Both are registered as `spec_created`. They are out of scope for Issue #346 (which is restricted to 08a canonical alignment) and are not promoted to a new unassigned-task here. If a future wave confirms the physical absence is unintended, a separate restore task analogous to Issue #346 should be opened. The 09c gate is not affected: 09c lives at `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/` and the targeted link check from 09c → 08a passes after this wave.

## Residual condition

If the execution wave for Issue #346 ever discovers that no valid 08a canonical, completed, or successor workflow root exists, the wave must either restore a canonical tree or keep this task open as the blocking restore task. It must not silently mark the downstream 09a / 09b / 09c gate as resolved.

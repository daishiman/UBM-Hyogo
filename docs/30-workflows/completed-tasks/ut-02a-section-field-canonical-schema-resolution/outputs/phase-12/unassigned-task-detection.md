# Unassigned Task Detection

## Result

New unassigned task candidates: 2.

## Scan Scope

| Scope | Result |
| --- | --- |
| AC-2 over-broad grep | resolved inside this task spec |
| generated manifest freshness | formalized as `task-ut02a-canonical-metadata-diagnostics-hardening-001.md` |
| 03a alias queue readiness | already modeled as upstream dependency |
| 04a / 04b view parity | already modeled as Phase 11 evidence |
| aiworkflow-requirements same-wave sync | completed in same wave |
| branch-level unrelated workflow deletions | formalized as `task-branch-workflow-deletion-audit-001.md` |

## Formalized Tasks

| Task | Priority | Reason |
| --- | --- | --- |
| `docs/30-workflows/unassigned-task/task-ut02a-canonical-metadata-diagnostics-hardening-001.md` | Medium | Static manifest regeneration, stale detection, and 03a retirement are larger than the current safe close-out patch |
| `docs/30-workflows/unassigned-task/task-branch-workflow-deletion-audit-001.md` | High | Unrelated workflow deletions are merge-level blockers and should not be hidden inside this UT-02A task |

## Boundary

The existing branch contains unrelated deletion risk for other workflow directories. It is now formalized separately because it can block merge safety even though it is outside the UT-02A implementation scope.

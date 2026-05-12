# Unassigned Task Detection

## Result

New unassigned tasks: 0.

## Existing Follow-up

| ID | Existing location | Status | Reason |
| --- | --- | --- | --- |
| #623 / followup-003 | `docs/30-workflows/unassigned-task/task-issue-325-followup-003-vitest-spec-suffix-convergence.md` | existing / blocked by #622 | The vitest `{test,spec}` -> `spec` convergence must wait until package rename is implemented. |

## Non-goal Rechecked

Package-level prefix expansion (`zod`, `db`, `contract`, `mapper`) is not formalized as a new task in this cycle. It is not required for `.test.ts` residual count to reach 0, and adding it now would break the rename-only boundary. Each ADR records it as a Non-goal for future need-based evaluation.


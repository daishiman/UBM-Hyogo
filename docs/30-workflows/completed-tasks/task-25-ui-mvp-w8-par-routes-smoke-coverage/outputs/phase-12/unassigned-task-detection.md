# Unassigned Task Detection

## Current-Cycle Fixes Completed

The following were not moved to backlog because they were self-consistency defects in task-25:

- stale parent workflow path
- missing `SMOKE-COVERAGE-MATRIX.md`
- Phase 12 placeholder outputs
- `spec_created` / Phase 5 wording mismatch
- Phase 11 NON_VISUAL evidence placeholder

## Future Candidates

| Candidate ID | Candidate | Owner workflow | Blocked reason | Formalize state |
| --- | --- | --- | --- | --- |
| T25-FU-VISUAL-BASELINE | Full visual baseline for remaining non-baseline surfaces | `docs/30-workflows/unassigned-task/task-25-followup-visual-baseline-expansion.md` | Requires product decision on baseline scope and screenshot budget | formalized as independent implementation / VISUAL follow-up |
| T25-FU-ERROR-FIXTURE | Deterministic error boundary smoke fixture | `docs/30-workflows/unassigned-task/task-25-followup-error-boundary-smoke-fixture.md` | Requires a stable throw route or fixture that does not alter production behavior | formalized as independent implementation / NON_VISUAL follow-up |
| T25-FU-LOADING-FIXTURE | Deterministic loading state observation fixture | `docs/30-workflows/unassigned-task/task-25-followup-loading-state-observation-fixture.md` | Requires stable latency control without flaky network sleeps | formalized as independent implementation / NON_VISUAL follow-up |

These are follow-ups, not blockers for task-25, because task-25's scope is coverage documentation and current fact reconciliation. Implementing them in this cycle would mix fixture design and screenshot baseline approval into a docs-only verification task.

# Documentation Changelog

## 2026-05-17

| Area | Change |
|---|---|
| workflow root | Added `artifacts.json`, `outputs/artifacts.json`, and Phase 12 strict 7 files |
| implementation docs | Corrected state vocabulary to `implemented_local_runtime_pending / implementation / VISUAL` |
| parent specs | Connected i07 parent spec and integration-fixes index to Issue #770 canonical workflow |
| source task | Marked source unassigned task as consumed without deleting historical trace |
| aiworkflow | Added resource-map, quick-reference, task-workflow-active, changelog, and artifact inventory entries |
| review fix | Added Phase 11 local component screenshot artifacts and normalized stale web app paths to `apps/web` |
| parent artifact | Updated integration-fixes `artifacts.json` and parallel-07 DoD state for Issue #770 |

## Validator Execution Log

| Command | Expected |
|---|---|
| `cmp -s artifacts.json outputs/artifacts.json` | exit 0 |
| stale package filter grep under workflow root | no active stale command references |
| stale parent in-place state grep under i07 parent spec | no active stale state references |

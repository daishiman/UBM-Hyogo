# Skill Feedback Report - issue-623

## Template Improvements

- Phase specs should distinguish measured local evidence from runtime-pending evidence. Planned paths in `artifacts.json` are useful, but Phase 12 must not treat them as PASS evidence before files exist.
- Status examples should use schema-allowed values only. Legacy draft-only labels must not be copied into current `artifacts.json`.

## Workflow Improvements

- For implementation packages that gain code diff in the same cycle, Phase 12 must promote state from `spec_created` to `implemented_local_runtime_pending` instead of keeping stale spec-only wording.
- Source unassigned tasks should remain active until implementation evidence is captured; once local implementation evidence exists, move them to `completed-tasks/` and leave only runtime evidence boundaries explicit.

## Documentation Improvements

- The active skill history files in this worktree are `SKILL-changelog.md`; references to non-existent root history files should be checked against actual file existence before being placed in a workflow.
- aiworkflow discovery registration should happen in the same wave as the workflow package so the new spec is findable.

## 30-Method Compact Evidence

The 30-method review grouped findings into four repair clusters: state vocabulary, phase/task dependency, evidence actuality, and same-wave discovery. The implemented fix updates those four clusters directly instead of adding another analysis-only note.

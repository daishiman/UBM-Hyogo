# Skill Feedback Report

## Template Improvements

| Finding | Promotion target | Decision | Evidence |
| --- | --- | --- | --- |
| Flat workflow roots can omit Phase 12 strict 7 while still pointing gates at `outputs/phase-12`. | `task-specification-creator` Phase 12 strict 7 rule | No template change required; existing rule already requires strict 7. This cycle materialized the missing files. | `outputs/phase-12/` |
| `taskType` and `visualEvidence` can be conflated in generated metadata. | `task-specification-creator` artifacts metadata guidance | No skill edit required; existing `taskType`/`visualEvidence` matrix is sufficient. This cycle corrected the instance. | `artifacts.json`, `outputs/artifacts.json` |
| aiworkflow-requirements sync can be missed for verify_existing specs. | `aiworkflow-requirements` workflow sync rule | No skill edit required; existing Specification-Driven Development rule already requires same-wave ledger sync. This cycle added ledger entries. | aiworkflow references and indexes |
| `pnpm --filter ... exec vitest --coverage` can resolve paths relative to the package cwd and fail for root-level config or repo-root test paths. | `task-specification-creator` Phase 7 coverage command examples | No skill edit required in this cycle; the local spec now uses repo-root `pnpm exec vitest --root=. --config=...` commands for targeted coverage. | `phase-7-coverage.md`, `outputs/phase-11/evidence/*-coverage.log` |

## Workflow Improvements

- Added Phase 12 strict 7 files.
- Added root/output artifacts parity.
- Reworded bonus items as out-of-scope scope boundaries, not default backlog.
- Preserved code-change-zero invariant for `verify_existing`.

## Documentation Improvements

- Added aiworkflow artifact inventory for this workflow.
- Added resource-map and quick-reference lookup entries.
- Added task-workflow-active entry so the workflow is discoverable from the requirements skill.
- Promoted status from `spec_created` to `verified_current_no_code_change_pending_pr` after Phase 11 evidence was captured.
- Fixed worktree diff wording so uncommitted docs and aiworkflow sync files are represented accurately while preserving apps/packages diff zero.

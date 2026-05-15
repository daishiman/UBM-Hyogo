# Skill Feedback Report

## Template Improvements

No owning skill source change is required in this wave. `task-specification-creator` already contains the relevant rule: workflows with `apps/` / `packages/` dirty diffs must not remain `spec_created`.

## Workflow Improvements

This review confirmed the rule should be applied aggressively:

- if implementation files appear after contract generation, reclassify to implementation-local state in the same wave
- do not leave Phase 12 saying "no app code changed" when `git status` shows `apps/` diffs
- separate local implementation completion from runtime visual evidence completion

## Documentation Improvements

The workflow now records:

- `implemented_local_runtime_pending` as the current state
- local typecheck success
- Vitest startup blocker (`esbuild` host/binary mismatch)
- Playwright visual blocker (`ENOSPC`)
- concrete code fixes found by the review

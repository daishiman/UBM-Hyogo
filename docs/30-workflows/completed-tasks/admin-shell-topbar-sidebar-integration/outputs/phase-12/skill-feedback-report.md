# Skill feedback report

## Template Improvements

No task-specification-creator template change is required. Existing rules already required `artifacts.json`, output parity, Phase 11 evidence boundary, and Phase 12 strict 7.

## Workflow Improvements

The correction applied the existing skill rule: workflows with `apps/` dirty diffs must not remain `spec_created`. Local implementation plus Phase 11 fixture screenshots are now classified as `implemented_local_evidence_captured`.

## Documentation Improvements

The workflow now has an aiworkflow artifact inventory, indexed discoverability entries, and a dedicated Playwright screenshot spec. Reusable lesson: when local code already exists for a VISUAL_ON_EXECUTION task, create current-root fixture screenshots in the same cycle instead of leaving Phase 11 as pending.

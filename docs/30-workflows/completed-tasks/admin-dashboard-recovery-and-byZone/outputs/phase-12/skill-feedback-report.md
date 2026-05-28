# Skill Feedback Report

## Template Improvements

No task-specification-creator template change is required. Existing rules
already require Phase 12 strict 7, root/output artifacts parity, canonical
compliance headings, and aiworkflow same-wave sync.

## Workflow Improvements

Applied learning: a standalone workflow created from a parent `tasks/*.md`
entry must still include `artifacts.json`, `outputs/artifacts.json`, strict 7,
and aiworkflow ledgers in the same wave. Keeping only Phase 1-13 markdown files
is insufficient.

## Documentation Improvements

The target workflow now records local implementation and local screenshot
evidence as present while keeping staging deploy/tail/curl boundaries pending.
The token-missing path is not a backlog escape hatch; it is either a
same-cycle minimal token addition or an implementation blocker recorded before
Phase 11.

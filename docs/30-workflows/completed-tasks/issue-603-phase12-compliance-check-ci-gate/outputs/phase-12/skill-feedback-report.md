# Skill Feedback Report

## Template Improvement

`task-specification-creator` now records that `verify-phase12-compliance` reads `references/phase12-compliance-check-template.md` `Required Sections` as the canonical heading SSOT. Changing heading text or order requires same-wave script and fixture updates.

## Workflow Improvement

The gate reads canonical headings before checking whether any workflow root changed. Template-only drift therefore fails instead of returning `noop`. The PR workflow also runs the focused Vitest suite before the verifier, and its `paths` include the workflow file itself and `package.json` so wiring-only regressions do not bypass the gate.

## Code Improvement

`collectChangedWorkflowRoots()` uses `git diff --name-status` so rename/delete semantics are visible. Deleted old roots in a same-wave move are skipped when no current `index.md` or `artifacts.json` root exists, while the moved destination root is still checked.

## Documentation Improvement

`aiworkflow-requirements` records the CI gate in deployment workflow inventory, active workflow state, source backlog consumption, and artifact inventory.

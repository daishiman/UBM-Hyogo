# Skill Feedback Report

## Template Improvement

Docs-only NON_VISUAL matrix tasks should keep three states separate in their templates:

| Category | Meaning |
| --- | --- |
| planned final deliverable | output required later only when the deliverable file is not present in the same diff |
| contract-only evidence | files required to prove a not-yet-generated specification package is coherent now |
| runtime evidence | not applicable unless UI/runtime execution is in scope |

## Workflow Improvement

For matrix-style verification tasks, the task-specification template should require `required_at` or equivalent wording for each output path. This prevents planned files from being mistaken for generated evidence.

## Documentation Improvement

The Phase 12 strict 7 requirement should be explicit even for contract-only docs roots when the compliance check claims Phase 12 close-out evidence.

## Promotion Result

| Feedback | Result |
| --- | --- |
| final deliverable state drift | promoted to `task-specification-creator` Phase 12 guide |
| `required_at` vs generated evidence wording | promoted to `task-specification-creator` Phase 12 guide |
| planned wording grep before close-out | promoted to `task-specification-creator` Phase 12 guide |

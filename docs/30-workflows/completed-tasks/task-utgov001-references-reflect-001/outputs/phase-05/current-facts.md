# Phase 5 Output: Current Facts

## Source

Fresh `gh api` GET captured during execution:

- `docs/30-workflows/completed-tasks/task-utgov001-references-reflect-001/outputs/phase-13/branch-protection-applied-dev.json`
- `docs/30-workflows/completed-tasks/task-utgov001-references-reflect-001/outputs/phase-13/branch-protection-applied-main.json`

## Current GitHub API Values

| Branch | contexts | strict | enforce_admins | linear_history | conversation_resolution | force_pushes | deletions | lock_branch |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| dev | `ci`, `Validate Build` | false | false | false | true | false | false | false |
| main | `ci`, `Validate Build` | true | false | false | true | false | false | false |

`verify-indexes-up-to-date` is not present in current applied GET evidence. It remains an expected-context drift item, not a current applied fact.

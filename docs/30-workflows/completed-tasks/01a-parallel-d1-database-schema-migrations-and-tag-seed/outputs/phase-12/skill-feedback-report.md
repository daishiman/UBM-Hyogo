# Skill Feedback Report

## task-specification-creator

| Finding | Feedback |
| --- | --- |
| Phase 12 outputs can be missed when a `spec_created` task later gains code changes | Keep the existing code-diff reclassification rule and require `outputs/phase-12/*` existence checks before close-out |
| Database-only tasks can falsely require screenshots | Phase 11 should allow explicit `NON_VISUAL` evidence with a reason and command output summary |

## aiworkflow-requirements

| Finding | Feedback |
| --- | --- |
| D1 schema facts expanded from the earlier 4-table contract to the 01a application schema | Keep quick-reference current facts split by source task so earlier contract facts and later implementation facts do not overwrite each other |

## Action

No structural skill rewrite is required.

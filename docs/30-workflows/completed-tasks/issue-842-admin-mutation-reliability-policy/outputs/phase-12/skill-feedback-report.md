# Skill Feedback Report

## Routing Summary

| Finding | Target | Decision | Evidence |
|---|---|---|---|
| Flat workflow had Phase 12 instructions but no strict 7 outputs. | `task-specification-creator` | No skill edit required; existing rule already requires strict 7. Fixed workflow files instead. | `outputs/phase-12/*` |
| Canonical workflow was not discoverable from aiworkflow-requirements indexes. | `aiworkflow-requirements` | Promote same-wave sync into indexes/inventory/changelog/LOGS. | `.claude/skills/aiworkflow-requirements/references/workflow-issue-842-admin-mutation-reliability-policy-artifact-inventory.md` |
| Old one-pager still said `pending`. | task workflow docs | Fixed source one-pager to `consumed_by_canonical_workflow`. | `docs/30-workflows/completed-tasks/admin-mutation-timeout-policy.md` |

## Template Improvements

No new template rule is required. The missing files were a local workflow compliance gap, not a missing rule: `phase-12-spec.md` already mandates strict 7 outputs, and `phase12-compliance-check-template.md` already covers flat-layout workflows.

## Workflow Improvements

For future spec-created implementation workflows, create `outputs/phase-12/` in the same wave as Phase 12 authoring. Do not leave Phase 12 as an instruction-only file when the workflow is meant to be discoverable and verifiable.

## Documentation Improvements

The aiworkflow-requirements inventory now points to the canonical Issue #842 workflow and its artifact inventory. This prevents users from landing on the stale one-pager as the execution source.

# Skill Feedback Report

## Template Improvements

| Item | Routing | Result |
| --- | --- | --- |
| Closed issue recovery specs need `issue_state_at_recovery` and `Refs`-only wording | Existing `task-specification-creator` recovery guidance | No source skill edit required in this cycle; workflow applied the rule. |
| Phase 12 outputs must be substantive, not just file stubs | Existing Phase 12 documentation guide | No source skill edit required; this workflow's outputs were corrected in-cycle. |

## Workflow Improvements

| Item | Routing | Result |
| --- | --- | --- |
| Missing downstream workflow roots must use ledger fallback rather than broken physical links | `aiworkflow-requirements` task workflow references | Applied to 04c / 09b in `task-workflow-active.md`. |
| Docs-only cleanup still needs `apps/` / `packages/` diff boundary evidence | `task-specification-creator` Phase 12 guide | Applied in `documentation-changelog.md` and compliance check. |

## Documentation Improvements

| Item | Routing | Result |
| --- | --- | --- |
| Stale current guidance must distinguish current, historical, and superseded rows | `aiworkflow-requirements` references | Applied across five references and one backlog ledger. |
| Artifact inventory should exist for new canonical workflow roots | `aiworkflow-requirements` indexes/references | Added workflow artifact inventory for Issue #291. |

## No-Op Decisions

- No `.claude/skills/task-specification-creator/` source edit was made because the needed gates already exist in `phase-12-documentation-guide.md`.
- No runtime code skill or integration test skill update was needed because this task has no code-path behavior change.

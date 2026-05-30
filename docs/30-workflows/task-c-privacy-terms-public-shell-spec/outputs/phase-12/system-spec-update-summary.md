# System Spec Update Summary

## aiworkflow-requirements Sync

Task C is registered as a child implementation-spec workflow for `public-header-logged-in-nav-cleanup`.
The registration is now updated to `implemented_local_evidence_captured` because `/privacy` and `/terms` implementation, focused checks, and Phase 11 screenshots are present.

| Target | Status |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | updated |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | updated |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | updated |
| `.claude/skills/aiworkflow-requirements/references/workflow-task-c-privacy-terms-public-shell-spec-artifact-inventory.md` | added |
| `.claude/skills/aiworkflow-requirements/changelog/20260528-task-c-privacy-terms-public-shell-spec.md` | added |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | updated |

## Contract Impact

No new API endpoint, D1 schema, Google Form schema, secret, or environment variable is introduced.
The implementation contract is UI shell alignment only: existing legal pages get public header/footer wrappers and session-aware CTA state.
The parent workflow already owns the broader public-header session-aware navigation contract.

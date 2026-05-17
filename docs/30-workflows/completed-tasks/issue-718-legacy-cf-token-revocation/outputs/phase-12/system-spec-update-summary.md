# System Spec Update Summary

## Updated Canonical Specs

| File | Update |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | Added Issue #718 legacy token revocation workflow as the Gate C retirement path. |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Added Issue #718 lookup under CI pipeline recovery / token cutover context. |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | Added Issue #718 quick lookup row. |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Added active workflow entry. |
| `.claude/skills/aiworkflow-requirements/references/workflow-issue-718-legacy-cf-token-revocation-artifact-inventory.md` | Added artifact inventory for Issue #718 workflow and same-wave sync surface. |
| `.claude/skills/aiworkflow-requirements/changelog/20260516-issue718-legacy-cf-token-revocation.md` | Added dedicated changelog entry. |
| `.claude/skills/aiworkflow-requirements/SKILL.md`, `SKILL-changelog.md`, `LOGS/_legacy.md` | Added Issue #718 skill history / log entries. |

## Runtime Boundary

The system spec records the planned retirement path only. It does not state that the legacy token has been revoked.

## Scope Note

The current worktree also contains i01 ToastProvider changes. They are a separate implementation wave and are not Issue #718 runtime evidence.

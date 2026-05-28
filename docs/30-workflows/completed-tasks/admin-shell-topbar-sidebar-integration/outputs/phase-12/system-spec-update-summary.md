# System spec update summary

## Updated Surfaces

| Surface | Status | Notes |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | updated | Adds active workflow entry. |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | updated | Adds quick lookup block. |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | updated | Adds progressive-disclosure entry. |
| `.claude/skills/aiworkflow-requirements/references/workflow-admin-shell-topbar-sidebar-integration-artifact-inventory.md` | created | Records workflow root, targets, and contract. |
| `.claude/skills/aiworkflow-requirements/changelog/20260526-admin-shell-topbar-sidebar-integration.md` | created | Records dated sync. |
| `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` | updated | Adds full skill changelog entry. |

## Current Contract

#894 and #895 remain historical CLOSED references. This workflow does not preserve the topbar slot-era contract; it makes `AdminPageHeader` the page-local owner of breadcrumb/title/actions.

No new API endpoint, D1 schema, or Auth.js middleware change is introduced.

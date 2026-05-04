# System Spec Update Summary — 06b-b-profile-request-pending-banner-sticky-001

## Decision

This workflow is now registered as the current canonical specification for the former unassigned sticky pending banner follow-up. It remains `spec_created`; no application code has been implemented in this cycle.

## Same-wave Updates

| Target | Update |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Added current sticky banner workflow row under 06b profile quick reference |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | Added current canonical resource-map row |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Added active workflow row and dependency order |
| `docs/30-workflows/unassigned-task/task-06b-b-profile-request-pending-banner-sticky-001.md` | Marked formalized by this workflow |
| `docs/30-workflows/LOGS.md` | Added formalization entry |

## Step 2 Contract Check

`GET /me/profile.pendingRequests` is a planned implementation contract, not an executed runtime fact. The current manual specs still describe 06b-B's implemented local banner. The sticky server-state behavior must be promoted to manual specs during the implementation close-out after code and tests exist.

## Boundary

No stale placeholder storage contract remains in this workflow. The specification now points to `admin_member_notes.request_status='pending'` and existing wire code `DUPLICATE_PENDING_REQUEST`.

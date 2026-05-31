# System spec update summary

## Status

`implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION`

## Step 1-A: workflow registration

| Target | Status | Note |
| --- | --- | --- |
| aiworkflow task inventory | updated in this wave | workflow artifact inventory added |
| quick-reference / resource-map / task-workflow-active | updated in this wave | Issue #982 discoverable from aiworkflow-requirements indexes |
| logs / changelog | updated in this wave | changelog fragments added where the skills use fragments instead of root `LOGS.md` files |

## Step 1-B: implementation status

| Workflow | State |
| --- | --- |
| `issue-982-drawer-tag-pill-editing` | `implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION` |

## Step 1-C: related task status

| Item | Status | Boundary |
| --- | --- | --- |
| Issue #982 | CLOSED | keep closed; PR text must use `Refs #982` |
| Issue #981 | separate follow-up | not a blocker because this workflow defines member-specific tag fetch |
| Issue #983 | separate follow-up | no overlap with tag editing |

## Step 2: conditional system spec update

Completed in this cycle. The code changes add current API endpoints and redefine invariant #13, so `docs/00-getting-started-manual/specs/01-api-schema.md`, `.claude/skills/aiworkflow-requirements/references/api-endpoints.md`, quick-reference/resource-map/task-workflow-active, artifact inventory, and changelog now treat the admin manual tag endpoints as local implemented system behavior. Runtime visual baseline, commit, push, and PR remain user-gated.

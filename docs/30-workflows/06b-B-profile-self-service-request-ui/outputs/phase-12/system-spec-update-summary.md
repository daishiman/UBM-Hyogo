# System Spec Update Summary

## Step 1-A: task workflow registration

Updated in this wave:

- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/references/legacy-ordinal-family-register.md`

## Step 1-B: implementation status

`06b-B-profile-self-service-request-ui` is `implemented-local / implementation / runtime-evidence-blocked / VISUAL_ON_EXECUTION`.

Local UI implementation is present in `apps/web`: `/profile` renders `VisibilityRequest` and `DeleteRequest`, browser-side requests go through `/api/me/*`, and focused unit/component/static invariant tests cover success, duplicate 409, disabled state, and no profile body edit form. Production runtime smoke and screenshots remain blocked until the serial prerequisite `06b-A-me-api-authjs-session-resolver` is complete.

## Step 1-C: related task status

- Depends on: `04b /me self-service API`, `06b profile page`, `06b-A-me-api-authjs-session-resolver`.
- Blocks: `06b-C-profile-logged-in-visual-evidence`, `08b profile E2E full execution`.

## Step 1-H: skill feedback routing

| Feedback | Target | Status |
| --- | --- | --- |
| Missing `outputs/artifacts.json` parity | task-specification-creator Phase 12 parity rule | Fixed in workflow |
| Missing Phase 12 strict 7 files | task-specification-creator Phase 12 strict files | Fixed in workflow |
| Missing aiworkflow index registration | aiworkflow-requirements resource map / quick reference / task workflow | Fixed in this wave |
| Missing implementation artifact inventory | aiworkflow-requirements workflow inventory | Added `references/workflow-task-06b-B-profile-self-service-request-ui-artifact-inventory.md` |
| Lessons learned hub | aiworkflow-requirements lessons | No new lesson file created; this wave uses existing 06b/Phase 12 lessons and records the lifecycle correction in changelog + skill feedback |

## Step 2: interface update

Triggered for web UI/client surface only.

- Added `/api/me/[...path]` browser proxy in `apps/web/app/api/me/[...path]/route.ts`.
- Added `apps/web/src/lib/api/me-requests-client.ts` for `requestVisibilityChange` and `requestAccountDeletion`.
- Added `/profile` self-service request UI components under `apps/web/app/profile/_components/`.
- Existing backend API SSOT remains 04b member self-service API; no new backend endpoint, database schema, or runtime config was added in this task.
- Visual/runtime evidence is separate from local implementation and remains delegated to 06b-A/06b-C gates.

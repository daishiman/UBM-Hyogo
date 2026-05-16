# System spec update summary

## Step 1: Same-wave sync

| Target | Decision |
| --- | --- |
| `docs/00-getting-started-manual/specs/09-ui-ux.md` | Updated stale `/resolve` endpoint to `/merge` + `/dismiss`, and row-local two-step confirmation wording. |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Added active workflow entry. |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | Added quick lookup row. |
| `.claude/skills/aiworkflow-requirements/changelog/20260516-serial-05-step-02-identity-conflicts-merge.md` | Added changelog entry. |
| `.claude/skills/aiworkflow-requirements/references/workflow-serial-05-step-02-identity-conflicts-merge-artifact-inventory.md` | Added artifact inventory. |

## Step 2: API / D1 / shared schema update

`not_required_existing_contract_reused`

No new API endpoint, D1 schema, or shared export was added. Existing contracts remain:

- `POST /admin/identity-conflicts/:id/merge`
- `POST /admin/identity-conflicts/:id/dismiss`
- `packages/shared/src/schemas/identity-conflict.ts`

## Step 3: Screenshots

Phase 11 screenshots are referenced from `implementation-guide.md` and exist under `../phase-11/`.

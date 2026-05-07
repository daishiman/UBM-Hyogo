# System Spec Update Summary

## 判定

aiworkflow-requirements reference update completed in this cycle.

## Reason

The canonical 06c-B implementation is already synchronized in:

- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-06c-B-admin-members-artifact-inventory.md`
- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md`
- `.claude/skills/aiworkflow-requirements/references/ui-ux-admin-dashboard.md`
- `.claude/skills/aiworkflow-requirements/references/lessons-learned-06c-B-admin-members-2026-05.md`

This workflow is an implementation execution spec / runtime evidence contract and does not supersede the completed canonical root.

To avoid orphaning this supplement, this cycle also registered `docs/30-workflows/06c-B-admin-members-implementation-execution/` in:

- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-06c-B-admin-members-artifact-inventory.md`

## Same-Cycle Correction

The review found a code/spec mismatch in the existing implementation. The implementation contract is now aligned by patching `apps/api/src/routes/admin/member-delete.ts` and `apps/api/src/routes/admin/member-delete.test.ts`:

- `reason` validation uses 422 for missing or over-limit values.
- delete response shape is `{ id, isDeleted: true, deletedAt }`.
- restore response shape is `{ id, restoredAt }`.

These are implementation-level corrections under the existing 06c-B system spec; no new canonical reference document is needed.

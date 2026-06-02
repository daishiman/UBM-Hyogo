# System Spec Update Summary

## Step 1-A: Current Canonical Set

- Workflow root: `docs/30-workflows/issue-1031-member-self-photo-upload/`
- State: `implemented_local_runtime_pending / implementation / VISUAL`
- Parent workflow: `docs/30-workflows/issue-983-member-photo-avatar-r2-storage/`
- Issue: #1031 CLOSED (verified 2026-06-01). Issue mutation is not performed in this wave.

## Step 1-B: Same-Wave Sync

- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-issue-1031-member-self-photo-upload-artifact-inventory.md`
- `.claude/skills/aiworkflow-requirements/changelog/20260601-issue-1031-member-self-photo-upload-spec.md`

## Step 1-C: Implementation Boundary

Local API, D1 metadata, R2 binding path, web proxy, and profile UI behavior are implemented in `apps/api` and `apps/web`. Remote D1 apply, staging deploy, authenticated member-session runtime screenshot, commit, push, PR, and Issue mutation are not performed in this wave.

## Step 2: Updated System Specs

- `docs/00-getting-started-manual/specs/01-api-schema.md`: registered `photoUrl?: string` on `GET /me/profile` and `member_photos` as schema-out admin-managed data.
- `docs/00-getting-started-manual/specs/08-free-database.md`: registered `member_photos.source TEXT NOT NULL DEFAULT 'admin'`.
- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md`: registered `POST /me/photo`, `DELETE /me/photo`, and fail-soft `GET /me/profile.photoUrl`.

## Step 3: Runtime Promotion

After user approval, remote D1 migration apply, staging deploy, and authenticated runtime screenshot can promote the state from `implemented_local_runtime_pending` to runtime-complete.

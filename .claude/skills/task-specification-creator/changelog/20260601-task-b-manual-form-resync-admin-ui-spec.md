# 2026-06-01 task-b-manual-form-resync-admin-ui-spec

## Summary

Promoted review feedback from `docs/30-workflows/completed-tasks/task-b-manual-form-resync-admin-ui-spec/`.

The workflow is `verify_existing + VISUAL_ON_EXECUTION`: the Task B manual Google Form resync admin UI already landed in commit `745c95115` / PR #1064, while authenticated runtime screenshot capture still requires an admin session and `SYNC_ADMIN_TOKEN` provisioning.

## Rule Promoted

- Do not close a VISUAL verify-existing workflow with zero image files when a static UI contract capture is possible.
- Static UI contract PNGs must be labeled separately from authenticated runtime screenshots.
- `implementation-guide.md`, `phase12-task-spec-compliance-check.md`, and Phase 11 capture metadata must all use the same two-stage boundary wording.
- Phase 12 system-spec sync must include task-specification-creator history ledger updates, not only aiworkflow-requirements sync.
- `generate-index.js` must recognize both `phase-N-slug.md` and compact `phase-N.md` workflow naming.

## Files Updated

- `SKILL.md`
- `SKILL-changelog.md`
- `LOGS/_legacy.md`
- `references/phase-12-documentation-guide.md`
- `scripts/generate-index.js`
- `scripts/__tests__/generate-index.test.mjs`

Commit, push, and PR remain user-gated.

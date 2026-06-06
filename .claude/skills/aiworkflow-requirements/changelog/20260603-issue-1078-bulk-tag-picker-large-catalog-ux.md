# 2026-06-03 issue-1078 Bulk Tag Picker Large Catalog UX

`issue-1078-bulk-tag-picker-large-catalog-ux` was synchronized as `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION`.

## Changes

- Implemented apps/web tag master client contract fix for `GET /admin/tags` `{ total, items }` response.
- Added `fetchTagMaster(opts)` query normalization and `fetchAllTagMaster(cap)` page walking with `pageSize=100`.
- Added BulkActionBar large catalog UX: search, category collapse, selected tag pinned row, and scroll-constrained picker.
- Added focused API client tests and expanded BulkActionBar tests.
- Updated aiworkflow-requirements API endpoint and admin API client references.

## Evidence

- `members.spec.ts`: 11 tests PASS.
- `BulkActionBar.spec.tsx`: 20 tests PASS.
- Broader web Vitest run: 216 files / 1587 tests PASS / 1 skipped.
- `mise exec -- pnpm typecheck`: PASS.
- `mise exec -- pnpm lint`: PASS.

## User-Gated

Staging authenticated visual screenshots, commit, push, PR creation, and GitHub issue mutation remain pending explicit user approval.


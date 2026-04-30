# Change Summary

## Code

- Added admin UI pages under `apps/web/app/(admin)/admin/`.
- Added admin components under `apps/web/src/components/admin/`.
- Added admin API proxy and server fetch helper.
- Fixed admin API auth forwarding by passing Auth.js session cookie to apps/api.
- Fixed member logical delete to call `POST /admin/members/:memberId/delete` with `reason`.
- Fixed `MemberDrawer` to use API-provided `profile.editResponseUrl`.
- Added meeting attendance summary to `GET /admin/meetings` and initialized UI duplicate-disabled state from existing attendance.

## Docs

- Completed Phase 12 output split.
- Added 06c entries to aiworkflow-requirements quick-reference, resource-map, and active workflow.
- Documented screenshot deferral to 08b/09a.

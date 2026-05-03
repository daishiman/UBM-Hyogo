# Phase 4 Output: Test Strategy

Status: SPEC_CREATED_BOUNDARY

Required verification at implementation time:

- API contract tests for `GET /admin/schema/diff`, `POST /admin/schema/aliases`, and `POST /admin/sync/schema`.
- Web interaction tests for `/admin/schema`.
- Admin authorization matrix for 401 / 403 / 200.
- Visual evidence in 08b Playwright E2E or 09a staging smoke.

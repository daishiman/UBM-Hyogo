# Phase 8 Documentation Updates

The canonical API contract already exists in `docs/00-getting-started-manual/specs/01-api-schema.md`:

- `/me/profile` returns attendance plus optional `attendanceMeta`.
- `/me/attendance` accepts `limit?: 1..200` and `cursor?: string`.
- Cursor is an opaque frontend value.
- `/me/profile` uses default 50 records.

This wave registers the workflow in aiworkflow-requirements indexes and task workflow ledgers.


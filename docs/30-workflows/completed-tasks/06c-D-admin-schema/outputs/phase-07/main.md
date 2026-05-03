# Phase 7 Output: AC Matrix

Status: SPEC_CREATED_BOUNDARY

AC mapping:

- `/admin/schema` access: web page + admin middleware + API `requireAdmin`.
- Diff list: `GET /admin/schema/diff`.
- Alias apply: `POST /admin/schema/aliases`.
- Schema resync: `POST /admin/sync/schema`.
- Protected fields: `publicConsent`, `rulesConsent`, and `responseEmail` remain non-editable.

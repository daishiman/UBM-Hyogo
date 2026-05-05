# Phase 8 Output: DRY And Consistency

Status: spec_created

Consistency rules:

- Keep one source for retryable response fields and reuse it in route tests, implementation guide, and `api-endpoints.md`.
- Keep one source for partial UNIQUE DDL and reuse it in migration runbook, database schema sync, and tests.
- Do not duplicate large SQL examples in more than one canonical implementation file without referencing the source.
- Preserve `response_fields` current schema: no `questionId` or `is_deleted` column is introduced by this task.

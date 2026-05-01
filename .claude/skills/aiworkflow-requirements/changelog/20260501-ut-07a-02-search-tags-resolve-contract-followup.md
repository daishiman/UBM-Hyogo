# changelog fragment: UT-07A-02 search-tags resolve contract follow-up

## Summary

UT-07A-02 consumed Issue #297 and completed Phase 1-12 with Phase 13 pending user approval.
The tag queue resolve request body is now a shared schema SSOT:

- `packages/shared/src/schemas/admin/tag-queue-resolve.ts`
- `apps/api/src/routes/admin/tags-queue.ts`
- `apps/web/src/lib/admin/api.ts`

## Requirements Sync

- `references/api-endpoints.md`
- `references/architecture-admin-api-client.md`
- `references/task-workflow-active.md`
- `indexes/resource-map.md`
- `indexes/quick-reference.md`
- `references/lessons-learned-07a-tag-queue-resolve-2026-04.md`
- `references/lessons-learned.md`
- `references/legacy-ordinal-family-register.md`

## Evidence

- shared tests: 14 files / 166 tests PASS
- focused API tests: 3 files / 31 tests PASS
- API typecheck PASS
- web typecheck PASS
- shared typecheck PASS

The broad API package-script invocation selected the full API suite and hit local Miniflare/D1
`EADDRNOTAVAIL`; focused evidence is the canonical local proof for this close-out.

## Follow-up

UT-07A-03 remains the staging smoke handoff. UT-07A-02 unassigned-task is marked consumed and
moved to `docs/30-workflows/completed-tasks/UT-07A-02-search-tags-resolve-contract-followup.md`.

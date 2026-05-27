# 2026-05-25 issue-913 server idempotency key persistence

## Changed

- Added server-side `Idempotency-Key` persistence for admin mutation routes in `apps/api`.
- Added `idempotency_keys` D1 migration, repository, middleware, env TTL contract, route wiring, and focused tests.
- Added save-failure fallback: if replay persistence fails after a successful handler response, the middleware deletes the in-flight row and preserves the handler response.
- Reclassified `docs/30-workflows/completed-tasks/issue-913-server-idempotency-key-persistence/` from `spec_created` to `implemented_local_evidence_captured`.
- Added workflow artifact inventory and quick-reference/resource-map/task-workflow entries.

## Evidence

- `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` PASS
- `mise exec -- pnpm --filter @ubm-hyogo/api lint` PASS
- focused middleware Vitest: 7 PASS
- focused repository Vitest: 3 PASS

## Boundary

Issue #913 remains CLOSED. PR text must use `Refs #913`. D1 apply / deploy / commit / push / PR are user-gated.

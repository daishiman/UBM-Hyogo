# Phase 9 Output: Quality Assurance

Status: implemented-local

Executed local gates:

- `pnpm --filter @ubm-hyogo/api typecheck` -> PASS (Node warning only: repo expects Node 24.x, local is v22.21.1)
- `pnpm --filter @ubm-hyogo/api exec vitest run --root=../.. --config=vitest.config.ts apps/api/src/workflows/schemaAliasAssign.test.ts apps/api/src/routes/admin/schema.test.ts apps/api/src/repository/schemaQuestions.test.ts` -> PASS
- Route contract tests now cover `422` validation, `409` collision, and `202` retryable `backfill_cpu_budget_exhausted`.
- Workflow tests now cover `schema_aliases` write target, idempotent re-apply, deleted response skip, batch back-fill, CPU budget exhaustion, and persisted `schema_diff_queue.backfill_status/backfill_cursor`.
- Miniflare D1 migrations include `0008_schema_alias_hardening.sql`, which creates `schema_aliases` and adds resumable back-fill columns to `schema_diff_queue`.

Deferred gate:

- Staging Workers/D1 10,000+ row measurement remains environment-dependent and is recorded in Phase 11 as deferred manual evidence. Local contract and workflow coverage is complete for the implemented boundary.

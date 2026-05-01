# Manual Evidence

Status: implemented-local / staging-deferred

Evidence template to fill during execution:

| Check | Command family | Result |
| --- | --- | --- |
| local typecheck | `pnpm --filter @ubm-hyogo/api typecheck` | PASS |
| local workflow/route tests | `pnpm --filter @ubm-hyogo/api exec vitest run --root=../.. --config=vitest.config.ts apps/api/src/workflows/schemaAliasAssign.test.ts apps/api/src/routes/admin/schema.test.ts apps/api/src/repository/schemaQuestions.test.ts` | PASS: 23 tests |
| retryable response | route test with `UT07B_BACKFILL_CPU_BUDGET_MS=-1` | PASS: HTTP 202 + `backfill_cpu_budget_exhausted` + `retryable=true` |
| idempotent retry | `schemaAliasAssign.test.ts` | PASS: re-apply does not double audit; resumed extra fields are back-filled |
| UNIQUE/collision reject | route/workflow collision tests + `0008_schema_alias_hardening.sql` | PASS locally: collision maps to HTTP 409; DDL includes partial unique index |
| staging D1 baseline | `bash scripts/cf.sh d1 ...` | deferred: requires staging env credentials |
| 2-step migration | `bash scripts/cf.sh d1 migrations ...` | deferred: requires staging env credentials |
| 10,000 row fixture | `bash scripts/cf.sh d1 execute ...` | deferred: requires staging env credentials |
| secret/PII grep | `rg` | not executed in this pass |

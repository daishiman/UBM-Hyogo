# Retryable Contract Design

Status: spec_created

`POST /admin/schema/aliases` must distinguish completed apply, continuing back-fill, CPU-budget exhaustion, collision, and validation failure.

| Case | HTTP | Body requirement |
| --- | --- | --- |
| dry run / complete | 200 | preview or completed back-fill summary |
| in progress | 202 | cursor, remaining estimate, `retryable: true` |
| CPU budget exhausted | 202 | `code/error = backfill_cpu_budget_exhausted`, retry metadata |
| stable key collision | 409 | revision and stable key |
| invalid request | 422 | validation details |

The implementation must record the final selected status code in `api-endpoints.md` during Phase 12 sync.

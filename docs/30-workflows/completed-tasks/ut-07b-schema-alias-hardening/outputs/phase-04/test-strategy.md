# Test Strategy

Status: spec_created

| Layer | Scope | Required coverage |
| --- | --- | --- |
| unit | repository and pure workflow helpers | collision pre-check, cursor math, budget transition |
| route | `POST /admin/schema/aliases` | 200 / retryable / 409 / 422 boundaries |
| workflow integration | Miniflare D1 + migrations | partial UNIQUE behavior, stage split, idempotent retry |
| staging | Workers + D1 | 10,000+ row CPU and retry evidence |

The test set must cover collision, idempotent retry, CPU-budget exhaustion, dryRun, and apply.

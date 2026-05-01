# Alternatives Comparison

| Option | Benefit | Cost | Decision |
| --- | --- | --- | --- |
| Optional `attendanceProvider` | Compatible and small | Fallback can hide missing wiring | Adopt |
| Hono ctx injection | Centralized request dependency | Leaks runtime context into repository builder | Reject |
| DI container | Scales to many dependencies | Adds framework complexity | Reject |

## Guardrail

Phase 4 must include a regression test that fails if profile construction uses only the fallback empty array on the injected route.

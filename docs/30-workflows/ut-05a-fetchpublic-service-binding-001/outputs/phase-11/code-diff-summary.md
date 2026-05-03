# Code Diff Summary — ut-05a-fetchpublic-service-binding-001

status: `STATIC_OBSERVED_RUNTIME_PENDING`

## Scope

This file is the Phase 11 contract for AC-1 / AC-2. Runtime verification is not executed until explicit user instruction.

| AC | Expected static fact | Current contract state |
| --- | --- | --- |
| AC-1 | `apps/web/src/lib/fetch/public.ts` uses `env.API_SERVICE.fetch(...)` first, logs `transport: "service-binding"`, and falls back to `PUBLIC_API_BASE_URL` / `process.env.PUBLIC_API_BASE_URL` / local default only when the binding is unavailable | static observed / runtime pending |
| AC-2 | `apps/web/wrangler.toml` declares `API_SERVICE` for staging and production | static observed / deploy pending |

## Canonical service names

| environment | binding | service |
| --- | --- | --- |
| staging | `API_SERVICE` | `ubm-hyogo-api-staging` |
| production | `API_SERVICE` | `ubm-hyogo-api` |

Do not use `ubm-hyogo-api-production`; it is not the current production Worker name in `apps/api/wrangler.toml`.

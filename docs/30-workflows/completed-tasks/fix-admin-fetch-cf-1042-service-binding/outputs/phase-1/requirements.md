# Phase 1: Requirements

## Scope

- Fix `fetchAdmin()` so staging/production Cloudflare Workers use `env.API_SERVICE.fetch()` instead of raw HTTP fetch to the same-account API Worker.
- Preserve HTTP fallback for local/test/Playwright paths when `INTERNAL_API_BASE_URL` is explicitly supplied.
- Keep admin Server Component callers unchanged; the transport switch belongs in the shared helper.

## Acceptance Criteria

- AC-1: Workers runtime with `API_SERVICE` uses service binding transport.
- AC-2: `NODE_ENV=test` or `PLAYWRIGHT_TEST=1` with explicit `INTERNAL_API_BASE_URL` uses HTTP fallback.
- AC-3: `cookie`, `x-internal-auth`, `content-type`, request method, and body are preserved across both transports.
- AC-4: Unit tests for binding, fallback, and error body propagation pass.
- AC-5: Runtime staging smoke remains user-gated.
- AC-6: Other admin Server Component routes inherit the fix through the common helper.

## Implementation Required

This is not a docs-only task. The defect is in `apps/web/src/lib/admin/server-fetch.ts`, and completion requires code and test changes under `apps/web`.

# Phase 1 Output: Requirements

## Scope

- Implement API-wide security headers for `apps/api` using Hono middleware.
- Add deny-by-default CORS allowlist behavior based on `Env.ALLOWED_ORIGINS`.
- Preserve existing route-level `Cache-Control` values.
- Keep the task NON_VISUAL; no UI changes or screenshots are required.

## Acceptance Criteria

- `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and HSTS are emitted.
- Protected API prefixes receive `Cache-Control: no-store` only when unset.
- CORS emits allow headers only for exact allowlisted origins.
- `apps/api/src/index.ts`, `apps/api/src/env.ts`, and `apps/api/wrangler.toml` are wired.
- Focused Vitest, public contract regression, typecheck, and lint pass locally.

## Implementation Classification

This is an implementation task. Real code changes under `apps/api` are required and present.

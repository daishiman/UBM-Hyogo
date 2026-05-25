# Implementation Guide

## Part 1: Concept

`apps/api` is the backend window that browsers and other clients call. This change adds a small guard at that window:

- it labels responses so browsers do not guess content types;
- it tells browsers not to leak referrer information;
- it advertises HTTPS-only access through HSTS;
- it prevents protected paths from being stored when no route-specific cache policy exists;
- it allows browser cross-origin access only from origins listed in `ALLOWED_ORIGINS`.

## Part 2: Technical Details

Implementation targets:

- `apps/api/src/middleware/security-headers.ts`
- `apps/api/src/middleware/__tests__/security-headers.spec.ts`
- `apps/api/src/index.ts`
- `apps/api/src/env.ts`
- `apps/api/wrangler.toml`

`securityHeaders()` runs before `corsFromEnv()` in `apps/api/src/index.ts`. It calls `await next()` and then adds static response headers, so preflight responses produced by `corsFromEnv()` still receive the security headers.

`corsFromEnv()` is intentionally hand-written instead of using `hono/cors`. Denied origins receive no CORS allow headers, allowed origins receive exact-origin `Access-Control-Allow-Origin` plus `Access-Control-Allow-Credentials: true`, and preflight responses use fixed allow methods / headers rather than echoing arbitrary request headers.

Verification:

```bash
pnpm --filter @ubm-hyogo/api typecheck
pnpm --filter @ubm-hyogo/api lint
pnpm exec vitest run apps/api/src/middleware/__tests__/security-headers.spec.ts
pnpm exec vitest run --config vitest.d1.config.ts apps/api/src/routes/public/index.contract.spec.ts
```

Current local result:

- Typecheck: passed
- Lint: passed
- Middleware unit tests: 15 passed
- Public contract regression: 9 passed

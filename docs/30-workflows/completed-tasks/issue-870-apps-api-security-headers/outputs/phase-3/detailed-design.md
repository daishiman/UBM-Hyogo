# Phase 3 Output: Detailed Design

## Public API

```ts
securityHeaders(options?: SecurityHeadersOptions): MiddlewareHandler<{ Bindings: Env }>
parseAllowedOrigins(raw?: string): string[]
corsFromEnv(): MiddlewareHandler<{ Bindings: Env }>
```

## Header Values

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Cache-Control: no-store` for protected prefixes only when unset

## CORS Behavior

- Missing or empty `ALLOWED_ORIGINS` means no origins are allowed.
- Origin matching is exact.
- Allowed preflight returns `204` with allow origin, methods, headers, credentials, and `Vary`.
- Denied preflight returns `204` without CORS allow headers.

## Design Gate

Approved to proceed to tests because the change is isolated to middleware, environment typing, runtime config, and focused regression tests.

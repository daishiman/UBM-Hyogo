# Phase 2 Output: Basic Design

## Middleware

- `securityHeaders()` runs globally and sets static API security headers after downstream route handling.
- `corsFromEnv()` runs globally and handles CORS response and preflight behavior from `ALLOWED_ORIGINS`.
- Middleware registration happens immediately after `new Hono<{ Bindings: Env }>()` and before route registration.

## Configuration

- `Env.ALLOWED_ORIGINS?: string` stores a comma-separated allowlist.
- `wrangler.toml` defines separate staging and production allowlists.

## Cache-Control Rule

The middleware adds `no-store` only for `/me`, `/auth`, `/admin`, and `/internal` when the response does not already include `Cache-Control`.

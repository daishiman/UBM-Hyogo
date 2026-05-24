# Phase 4 Output: Test Plan

## Test File

- `apps/api/src/middleware/__tests__/security-headers.spec.ts`

## Planned Coverage

- Static security headers are emitted.
- HSTS max-age can be customized for unit verification.
- Protected prefixes receive `Cache-Control: no-store`.
- Public or partial-prefix paths do not receive protected cache policy.
- Existing `Cache-Control` is preserved.
- `parseAllowedOrigins` trims comma-separated values and drops blanks.
- CORS allowlist allows exact origins only.
- Missing `ALLOWED_ORIGINS` denies by default.
- Allowed and denied preflight responses are covered.

## Regression

- `apps/api/src/routes/public/index.contract.spec.ts` verifies public `Cache-Control` behavior remains intact.

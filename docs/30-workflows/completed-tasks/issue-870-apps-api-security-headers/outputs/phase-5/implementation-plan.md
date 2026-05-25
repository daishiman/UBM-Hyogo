# Phase 5 Output: Implementation Plan

## Code Changes

- Add `apps/api/src/middleware/security-headers.ts`.
- Add `apps/api/src/middleware/__tests__/security-headers.spec.ts`.
- Import and register `securityHeaders()` and `corsFromEnv()` in `apps/api/src/index.ts`.
- Add `ALLOWED_ORIGINS?: string` to `apps/api/src/env.ts`.
- Add staging and production `ALLOWED_ORIGINS` values to `apps/api/wrangler.toml`.

## Local Commands

```bash
pnpm --filter @ubm-hyogo/api typecheck
pnpm --filter @ubm-hyogo/api lint
pnpm exec vitest run apps/api/src/middleware/__tests__/security-headers.spec.ts
pnpm exec vitest run --config vitest.d1.config.ts apps/api/src/routes/public/index.contract.spec.ts
```

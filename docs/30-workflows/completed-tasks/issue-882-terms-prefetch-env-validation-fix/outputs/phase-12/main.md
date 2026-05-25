# Phase 12 Main — issue-882-terms-prefetch-env-validation-fix

## Summary

Issue #882 is implemented locally. The root metadata path no longer throws when public env parsing fails during `/terms` RSC prefetch.

## Changed Files

| Area | Files |
| --- | --- |
| Env accessor | `apps/web/src/lib/env.ts` |
| Metadata fallback | `apps/web/src/lib/seo/site-metadata.ts` |
| Unit tests | `apps/web/src/lib/__tests__/env.spec.ts`, `apps/web/src/lib/seo/__tests__/site-metadata.spec.ts` |
| Runtime smoke | `apps/web/playwright/tests/terms-prefetch.spec.ts` |
| Workflow docs | `docs/30-workflows/issue-882-terms-prefetch-env-validation-fix/**` |

## Verification

- `pnpm --filter @ubm-hyogo/web test -- src/lib/__tests__/env.spec.ts src/lib/seo/__tests__/site-metadata.spec.ts`: PASS (full web Vitest expanded; 1030 passed)
- `pnpm --filter @ubm-hyogo/web typecheck`: PASS
- `pnpm --filter @ubm-hyogo/web lint`: PASS
- `PLAYWRIGHT_BASE_URL=http://localhost:3100 ... terms-prefetch.spec.ts --project=desktop-chromium`: PASS

## User-Gated Items

commit, push, PR creation, and staging deploy remain blocked until explicit user approval.

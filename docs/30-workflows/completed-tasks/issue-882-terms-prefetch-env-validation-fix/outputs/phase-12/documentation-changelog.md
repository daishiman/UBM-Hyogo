# Documentation Changelog — issue-882-terms-prefetch-env-validation-fix

## 2026-05-25

| File | Change |
| --- | --- |
| `docs/30-workflows/issue-882-terms-prefetch-env-validation-fix/artifacts.json` | Reclassified workflow as `implemented_local_evidence_captured`, updated target smoke path, marked Phase 1-12 completed |
| `docs/30-workflows/issue-882-terms-prefetch-env-validation-fix/index.md` | Added implementation result summary |
| `docs/30-workflows/issue-882-terms-prefetch-env-validation-fix/phase-11-manual-test.md` | Reclassified as NON_VISUAL runtime evidence and linked actual Playwright evidence |
| `docs/30-workflows/issue-882-terms-prefetch-env-validation-fix/phase-12-documentation.md` | Marked Phase 12 completed and user-gated Phase 13 boundary |
| `docs/00-getting-started-manual/specs/05-pages.md` | Added public metadata env fallback contract for `getPublicEnvSafe()` / noindex fallback |
| `docs/30-workflows/unassigned-task/home-page-prototype-alignment-followup-001-terms-prefetch-env-validation.md` | Marked source follow-up consumed by canonical workflow |

## Code Changelog

| File | Change |
| --- | --- |
| `apps/web/src/lib/env.ts` | Added `getPublicEnvSafe()` |
| `apps/web/src/lib/seo/site-metadata.ts` | Added private public-env fallback for metadata generation |
| `apps/web/src/lib/__tests__/env.spec.ts` | Added safe accessor success/failure tests |
| `apps/web/src/lib/seo/__tests__/site-metadata.spec.ts` | Added fallback URL/noindex tests |
| `apps/web/playwright/tests/terms-prefetch.spec.ts` | Added `/terms` prefetch regression smoke |

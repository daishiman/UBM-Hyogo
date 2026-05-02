# Phase 11 Manual Smoke Log

## NON_VISUAL Evidence

- `grep -l 'sync-shared-modules-owner' apps/api/src/jobs/_shared/*.ts`
- `pnpm exec vitest run --config vitest.config.ts apps/api/src/jobs/_shared`
- `pnpm --filter @ubm-hyogo/api typecheck`
- `pnpm --filter @ubm-hyogo/api lint`
- `gh api repos/daishiman/UBM-Hyogo/codeowners/errors`

UI screenshot は対象外。

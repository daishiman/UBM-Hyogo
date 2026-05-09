# Implementation Guide

3b turns `.github/workflows/e2e-tests.yml` into the `e2e-tests-coverage-gate` PR check.

Expected implementation files:

- `.github/workflows/e2e-tests.yml`
- `apps/web/playwright.config.ts`
- `apps/web/package.json`
- `scripts/coverage-gate-e2e.sh`
- `pnpm-lock.yaml`

The line coverage threshold remains the standard tier: `70%`.

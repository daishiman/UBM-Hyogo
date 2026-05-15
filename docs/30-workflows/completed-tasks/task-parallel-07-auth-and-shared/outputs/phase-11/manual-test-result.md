# Phase 11 Manual / Visual Test Result

## Verdict

PASS: local Playwright visual evidence captured for 4 scenarios x light/dark = 8 PNG.

## Command

```bash
PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/task-parallel-07-auth-and-shared/outputs/phase-11 pnpm --filter @ubm-hyogo/web exec playwright test apps/web/playwright/tests/auth-and-shared.spec.ts --project=desktop-chromium
```

Result: 8 passed.

## Screenshot Inventory

| Scenario | Path |
|---|---|
| login loading / light | `outputs/phase-11/login-loading-light.png` |
| login loading / dark | `outputs/phase-11/login-loading-dark.png` |
| login error / light | `outputs/phase-11/login-error-light.png` |
| login error / dark | `outputs/phase-11/login-error-dark.png` |
| root error / light | `outputs/phase-11/root-error-light.png` |
| root error / dark | `outputs/phase-11/root-error-dark.png` |
| profile loading / light | `outputs/phase-11/profile-loading-light.png` |
| profile loading / dark | `outputs/phase-11/profile-loading-dark.png` |

## Deterministic Evidence

- `pnpm --filter @ubm-hyogo/web test -- apps/web/app/login/__tests__/login-error.component.spec.tsx apps/web/app/__tests__/error.component.spec.tsx apps/web/app/profile/__tests__/profile-loading.component.spec.tsx`: PASS. The current web test script runs the full `apps/web` Vitest set; observed result was 85 files passed, 579 tests passed, 1 file / 1 test skipped.
- `apps/web/playwright/tests/auth-and-shared.spec.ts`: PASS, 8 tests.
- `pnpm --filter @ubm-hyogo/web typecheck`: PASS.
- `pnpm --filter @ubm-hyogo/web lint`: PASS.
- `pnpm --filter @ubm-hyogo/web verify-design-tokens`: PASS, 9 tests.
- `pnpm verify:phase12-compliance docs/30-workflows/task-parallel-07-auth-and-shared`: PASS.
- `apps/web/app/loading.tsx` and `apps/web/app/not-found.tsx` verified as existing OKLch / branded fallback surfaces; no implementation diff required.

## Boundary

Staging smoke, broad task-18 visual regression, commit, push, and PR are not executed in this cycle and remain user-gated.

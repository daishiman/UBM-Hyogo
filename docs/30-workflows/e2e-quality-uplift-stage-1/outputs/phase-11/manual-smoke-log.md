# Manual Smoke Log

- status: E2E_PASS
- task type: implementation / NON_VISUAL
- target specs: `public-flow.spec.ts`, `profile-visibility-request.spec.ts`, `profile-delete-request.spec.ts`
- runtime command: `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=desktop-chromium playwright/tests/public-flow.spec.ts playwright/tests/profile-visibility-request.spec.ts playwright/tests/profile-delete-request.spec.ts`
- typecheck command: `mise exec -- pnpm --filter @ubm-hyogo/web typecheck`
- result: typecheck PASS; `playwright --list` PASS with 9 target tests; focused E2E PASS, see `outputs/phase-11/evidence/e2e-run.txt`

# Phase 11 Main

workflow: e2e-quality-uplift-stage-1
taskType: implementation
visualEvidence: NON_VISUAL
evidence_status: E2E_PASS

## Target Specs

- `apps/web/playwright/tests/public-flow.spec.ts`
- `apps/web/playwright/tests/profile-visibility-request.spec.ts`
- `apps/web/playwright/tests/profile-delete-request.spec.ts`

## One-line Commands

- `mise exec -- pnpm --filter @ubm-hyogo/web typecheck`
- `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=desktop-chromium playwright/tests/public-flow.spec.ts playwright/tests/profile-visibility-request.spec.ts playwright/tests/profile-delete-request.spec.ts`

## Evidence Files

- `outputs/phase-11/evidence/e2e-run.txt`
- `outputs/phase-11/evidence/e2e-skip-count.txt`
- `outputs/phase-11/evidence/runner-version.txt`
- `outputs/phase-11/evidence/e2e-list.txt`
- `outputs/phase-11/screenshots/visibility-pending.png`
- `outputs/phase-11/screenshots/delete-pending.png`

## Boundary

This phase verifies the Stage 1 regression assertions added to the three existing Playwright specs. Focused desktop Chromium E2E passes with the local signed auth fixture, local mock API for server-side profile fetches, and the minimal accent token contrast fix. It does not claim PR creation; Phase 13 remains user-gated.

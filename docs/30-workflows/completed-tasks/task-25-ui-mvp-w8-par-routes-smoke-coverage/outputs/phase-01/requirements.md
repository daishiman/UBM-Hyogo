# Phase 1 Requirements

## Decision

`implementation_mode = verify_existing`。新規 Playwright spec は追加せず、既存 `apps/web/playwright/tests/full-smoke.spec.ts` と `apps/web/playwright/tests/visual/*.spec.ts` の保護範囲を matrix 化する。

## Current Facts

| Item | Fact |
| --- | --- |
| Executable smoke entries | 17 URL entries in `full-smoke.spec.ts` |
| Parent UI surfaces | 19 surfaces in SCOPE: 17 URL entries + `error.tsx` + `loading.tsx` |
| Visual baselines | 4 files: login, public-top, admin-dashboard, profile |
| Main deliverable | `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` |

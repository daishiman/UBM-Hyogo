# Phase 7 Coverage Report

State: `completed`

## Contract vs Actual

| Item | Expected | Actual | Verdict |
| --- | ---: | ---: | --- |
| `VISUAL_ROUTES.length` (apps/web/playwright/fixtures/visual-routes.ts) | 17 | 17 | PASS |
| `EXPECTED_VISUAL_ROUTE_COUNT` | 17 | 17 | PASS |
| visual-full project count (playwright.config.ts) | 3 | 3 (desktop/tablet/mobile) | PASS |
| baseline PNG count | 51 | 51 | PASS |

## Verification

```bash
$ ls apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/*.png | wc -l
51

$ grep -E "EXPECTED_VISUAL_ROUTE_COUNT" apps/web/playwright/fixtures/visual-routes.ts
export const EXPECTED_VISUAL_ROUTE_COUNT = 17
```

## Source

- baseline PNGs imported from `chore/visual-baseline-update-25960870639` (commit `b3fb7f4a`)
- workflow run: https://github.com/daishiman/UBM-Hyogo/actions/runs/25960870639
- runtime env: `ubuntu-latest` + chromium (CI fixed for OS-drift suppression)

## Coverage Matrix Reflection

`docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` updated:
- Axis Totals `Visual baseline`: `4/19` → `17/19`
- Coverage Matrix rows #2..#6, #10..#17: Visual baseline column populated with slug
- Future Candidates: "Full visual regression baseline" row removed (resolved by task-709)

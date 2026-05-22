# Phase 4 Test Plan

| Check | Command | Expected |
| --- | --- | --- |
| Matrix row count | `grep -E '^\\| [0-9]+ \\|' docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md \| wc -l` | `19` |
| Smoke route entries | `rg -n "path: '" apps/web/playwright/tests/full-smoke.spec.ts \| wc -l` | `17` |
| Visual specs | `ls apps/web/playwright/tests/visual/*.spec.ts \| wc -l` | `4` |
| CI gates | `rg -n "playwright-smoke|verify-design-tokens" .github/workflows package.json apps/web/package.json` | all three gate names discoverable |

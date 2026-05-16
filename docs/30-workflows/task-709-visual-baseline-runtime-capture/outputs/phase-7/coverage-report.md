# Phase 7 Coverage Report

State: `runtime_pending`

The baseline coverage check is not complete because the user-gated baseline capture workflow has not been run in this cycle.

## Expected Contract

| Item | Expected |
| --- | ---: |
| `VISUAL_ROUTES.length` | 17 |
| visual-full project count | 3 |
| expected baseline PNG count | 51 |

## Runtime Command

Run after baseline capture approval and import:

```bash
SNAPSHOT_DIR=apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots
ls "$SNAPSHOT_DIR"/*.png 2>/dev/null | wc -l
```

Expected result: `51`.

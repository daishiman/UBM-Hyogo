# Implementation Guide

## What Changed

The Playwright visual spec previously wrote screenshots to the pre-archive path:

`docs/30-workflows/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/`

The parent workflow is now under `completed-tasks`, so the spec now defaults to:

`docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/`

It also accepts `PARALLEL09_EVIDENCE_DIR` for future path moves or CI evidence roots.

## Re-run Command

```bash
mise exec -- pnpm --dir apps/web exec playwright test --config=playwright.parallel09.config.ts --reporter=line
```

`apps/web/playwright.parallel09.config.ts` starts the local `pnpm dev:webpack` web server automatically when `PLAYWRIGHT_BASE_URL` is not set. Set `PLAYWRIGHT_BASE_URL` only when intentionally targeting an already-running external server.

## Evidence Gates

```bash
EVID="docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots"
find "$EVID" -maxdepth 1 -name '*.png' -print | sort | wc -l
find "$EVID" -name '*.png' -size +500k -print
find "$EVID" -name '*.png' -size 0 -print
```

Expected: 12 files, no files over 500KB, no zero-byte files.

## Screenshot References

The canonical screenshots are stored in the parent workflow, not duplicated in this recovery workflow:

- `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/01-formfield-error.png`
- `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/01-formfield-error@2x.png`
- `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/02-icon-4sizes.png`
- `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/02-icon-4sizes@2x.png`
- `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/03-breadcrumb.png`
- `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/03-breadcrumb@2x.png`
- `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/04-focus-visible.png`
- `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/04-focus-visible@2x.png`
- `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/05-pagination-disabled.png`
- `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/05-pagination-disabled@2x.png`
- `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/06-empty-state.png`
- `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/06-empty-state@2x.png`

# baseline-list

State: `runtime_pending`

The 51 Linux baseline PNG files have not been captured in this execution cycle because baseline regeneration is a user-gated GitHub Actions workflow.

Expected source of truth:

- routes: `apps/web/playwright/fixtures/visual-routes.ts` (`VISUAL_ROUTES.length = 17`)
- projects: `visual-full-chromium-desktop`, `visual-full-chromium-tablet`, `visual-full-chromium-mobile`
- expected count: `17 * 3 = 51`
- destination: `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/`

When runtime capture is approved, replace this placeholder with a table:

| # | slug | viewport | filename | sha256 | visual verdict |
| ---: | --- | --- | --- | --- | --- |
| 1 | root | desktop | `<pending>` | `<pending>` | runtime_pending |

Completion is blocked until all expected rows are present and visually reviewed.

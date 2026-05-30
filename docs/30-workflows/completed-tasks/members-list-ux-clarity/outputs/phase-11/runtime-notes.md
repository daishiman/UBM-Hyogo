# Phase 11 Runtime Notes

- Captured at: 2026-05-28T15:10:00+09:00.
- Source: local Next dev server on `http://localhost:3008` with Playwright Chromium.
- Matrix: 4 viewports x 3 density values x 2 states = 24 PNG screenshots.
- Screenshot directory: `outputs/phase-11/screenshots/`.
- Dynamic region masked where the Playwright spec path was used: `[data-role="pagination-meta"]`.
- Playwright browser dependency was installed locally with `pnpm --filter @ubm-hyogo/web exec playwright install chromium`.
- Full Playwright spec did not finish green because the first test in a fresh dev-server run hit a local mock/API warm-up race; after warm-up the remaining matrix cases passed and the missing mobile comfy PNGs were captured with a direct Playwright script against the same local dev server.

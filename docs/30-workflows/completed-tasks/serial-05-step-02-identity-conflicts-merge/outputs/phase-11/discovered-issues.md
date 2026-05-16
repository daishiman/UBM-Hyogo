# Phase 11 discovered issues

| Severity | Issue | Resolution |
| --- | --- | --- |
| Blocker | Phase 11 spec used stale modal wording while implementation is inline panel | Fixed in `phase-11.md` and evidence naming. |
| Blocker | Raw API error code surfaced to operators | Fixed by `useAdminMutation` operator message map and tests. |
| Note | Playwright Chromium was not installed locally | Installed via `pnpm exec playwright install chromium`. |
| Info | Initial click before hydration did not open panel | Capture script now waits before interaction. |

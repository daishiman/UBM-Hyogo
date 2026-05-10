# Phase 11 Component Evidence Log

Date: 2026-05-09

## Commands

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- PublicVisibilityBanner
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
rg -n '#[0-9a-fA-F]{6,8}\b|bg-\[#|text-\[#' apps/web/app/profile
cmp -s docs/30-workflows/task-14-my-profile-and-requests/artifacts.json docs/30-workflows/task-14-my-profile-and-requests/outputs/artifacts.json
```

## Results

| Command | Result |
| --- | --- |
| `mise exec -- pnpm --filter @ubm-hyogo/web test -- PublicVisibilityBanner` | PASS: Vitest ran the web suite; 67 test files passed / 1 skipped, 500 tests passed / 1 skipped |
| `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | PASS: exit 0 |
| `mise exec -- pnpm --filter @ubm-hyogo/web lint` | PASS: exit 0 |
| `rg -n '#[0-9a-fA-F]{6,8}\b|bg-\[#|text-\[#' apps/web/app/profile` | PASS: no matches |
| `cmp -s .../artifacts.json .../outputs/artifacts.json` | PASS: exit 0 |

## Boundary

This file records component/local evidence only. Screenshot, Playwright profile smoke, deploy, production smoke, and 24h Sentry observation remain deferred to `manual-evidence-deferred.md` and user-gated runtime execution.

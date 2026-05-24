---
workflow_id: ut-dsf-07-staging-visual-runtime-evidence
phase: 12
task: implementation-guide
status: present
---

# Implementation Guide

## Part 1: Plain Explanation

UT-DSF-07 proves that the design system still looks correct after the web app is built and served by Cloudflare Workers staging. Local screenshots are not enough because they use a local dev server and mock fixtures. This task creates a staging-specific Playwright path and stores the resulting screenshots as Phase 11 evidence.

## Part 2: Technical Contract

| Area | Contract |
| --- | --- |
| Playwright project | Add `staging-visual` without changing the existing local visual project. |
| Runtime URL | Use `https://ubm-hyogo-web-staging.daishimanju.workers.dev` or an explicit staging base URL input. |
| Screenshot set | `public-top`, `login`, `profile`, `admin-dashboard`. No members-list/detail expansion in this task. |
| Evidence root | `docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence/outputs/phase-11/`. |
| Screenshot evidence | `outputs/phase-11/screenshots/public-top.png`, `login.png`, `profile.png`, `admin-dashboard.png` after staging capture. |
| Baseline source | `apps/web/playwright/tests/visual-staging/*-snapshots/*-staging-visual-chromium-linux.png`, generated on ubuntu-latest. |
| Parent release | Update `ui-prototype-design-system-foundation` from `VISUAL_RUNTIME_PENDING` to `VISUAL_RUNTIME_OK` only after evidence exists. |
| Forbidden shortcuts | No fake PNG placeholders, no production deploy, no new API endpoint, no D1 schema change. |

### Verification Commands

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web build
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
mise exec -- pnpm --filter @ubm-hyogo/web e2e:visual:staging
bash scripts/verify-pr-ready.sh
```

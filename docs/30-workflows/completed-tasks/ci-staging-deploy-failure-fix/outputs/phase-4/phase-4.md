# Phase 4: Test strategy

NON_VISUAL CI recovery tests.

| Target | Test |
| --- | --- |
| build-time env contract | `apps/web/src/lib/__tests__/build-time-env.spec.ts` |
| invariant: no new direct `process.env` access | grep gate excluding `apps/web/src/lib/env.ts` and tests |
| invariant: no local API URL burn-in | grep gate for `127\\.0\\.0\\.1:8888` |
| OpenNext build smoke | staging placeholder env + `pnpm --filter @ubm-hyogo/web build:cloudflare` |
| token recovery | `scripts/cf.sh whoami`, D1 migration list, deploy dry-run after user updates secrets |

Secret mutation and runtime GitHub Actions execution are Phase 11 runtime pending gates.


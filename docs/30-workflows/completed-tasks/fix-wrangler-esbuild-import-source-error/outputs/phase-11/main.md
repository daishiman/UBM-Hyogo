# Phase 11 Evidence Index

## NON_VISUAL Declaration

This task changes dependency resolution and Cloudflare build/deploy tooling only. UI/UX screenshots are not required.

## Local Evidence

| Evidence | Command | Result |
| --- | --- | --- |
| install / lockfile update | `mise exec -- pnpm install --frozen-lockfile=false` | exit 0 |
| dependency resolution | `mise exec -- pnpm why esbuild` | exit 0; one resolved version: `esbuild@0.27.3` |
| esbuild executable | `mise exec -- pnpm exec esbuild --version` | exit 0; `0.27.3` |
| shell syntax | `bash -n scripts/cf.sh` | exit 0 |
| web OpenNext build | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | exit 0 |
| api wrangler dry-run | `mise exec -- pnpm --filter @ubm-hyogo/api exec wrangler deploy --env staging --dry-run` | exit 0 |
| artifacts parity | `cmp -s artifacts.json outputs/artifacts.json` | exit 0 |

## Runtime Boundary

`web-cd` / `backend-ci` deploy-staging GitHub Actions evidence and runtime smoke evidence remain Phase 13 user-gated. They are not represented as runtime PASS in this cycle.


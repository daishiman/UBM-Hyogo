# Phase 11 NON_VISUAL Evidence

## Local Evidence Captured

| Command | Result |
| --- | --- |
| `mise exec -- pnpm install --force` | completed |
| `pnpm exec esbuild --version` | `0.27.3` |
| `pnpm why esbuild` | one version: `esbuild@0.27.3` |
| `mise exec -- pnpm typecheck` | PASS |
| `mise exec -- pnpm lint` | PASS |
| `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --dry-run --outdir /tmp/api-bundle` | PASS |
| `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | BLOCKED: `SENTRY_DO SQLite failed ... attempt to write a readonly database`; no `import-source` error |

## Pending Evidence

| Evidence | Boundary |
| --- | --- |
| web OpenNext build | local Miniflare/workerd SQLite readonly database blocker; not an esbuild parser failure |
| `web-cd / deploy-staging` | user-gated push required |
| `backend-ci / deploy-staging` | user-gated push required |

Verdict: `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`.

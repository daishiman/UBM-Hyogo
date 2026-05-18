# Phase 5 Local Verification

## Completed

| Command | Result |
| --- | --- |
| `mise exec -- pnpm install --force` | completed; lockfile regenerated |
| `pnpm exec esbuild --version` | `0.27.3` |
| `pnpm why esbuild` | one version: `esbuild@0.27.3` |
| `mise exec -- pnpm typecheck` | PASS |
| `mise exec -- pnpm lint` | PASS |
| `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --dry-run --outdir /tmp/api-bundle` | PASS; dry-run upload summary printed and exited 0 |
| `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | BLOCKED by separate Miniflare/workerd SQLite readonly database startup error; no `import-source` esbuild error observed |

## Pending Runtime-Adjacent Checks

| Command | Boundary |
| --- | --- |
| `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | blocked by local Miniflare/workerd SQLite readonly database startup, separate from esbuild convergence |

These checks are tracked in Phase 11 evidence as local commands or explicit runtime-pending boundaries.

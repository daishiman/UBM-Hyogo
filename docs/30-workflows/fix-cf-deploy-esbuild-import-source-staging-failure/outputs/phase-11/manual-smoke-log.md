# Manual Smoke Log

| Command | Expected | Actual | Verdict |
| --- | --- | --- | --- |
| `mise exec -- pnpm install --force` | lockfile regenerates with `esbuild@0.27.3` | exit 0 | PASS |
| `pnpm exec esbuild --version` | exact `0.27.3` | `0.27.3` | PASS |
| `pnpm why esbuild` | single resolved esbuild version | one version: `esbuild@0.27.3` | PASS |
| `mise exec -- pnpm typecheck` | exit 0 | exit 0 | PASS |
| `mise exec -- pnpm lint` | exit 0 | exit 0 | PASS |
| `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --dry-run --outdir /tmp/api-bundle` | exit 0 and no `import-source` parser error | exit 0 | PASS |
| `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | OpenNext Cloudflare build completes, or stops at a non-esbuild blocker without `import-source` recurrence | exit 1, blocked by `SENTRY_DO SQLite failed ... attempt to write a readonly database`; no `import-source` error | RUNTIME_PENDING |
| `mise exec -- pnpm test` | no esbuild transform regression | exit 0 | PASS |

GitHub Actions deploy evidence remains user-gated by commit / push / PR prohibition.

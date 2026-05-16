# Manual Smoke Log

| Step | Command | Exit | Notes |
| --- | --- | ---: | --- |
| install | `mise exec -- pnpm install --frozen-lockfile=false` | 0 | Updated `pnpm-lock.yaml`; pnpm reported ignored `@sentry/cli` build script warning only. |
| dependency | `mise exec -- pnpm why esbuild` | 0 | Found one version: `esbuild@0.27.3`; `wrangler@4.85.0` resolves through the override. |
| executable | `mise exec -- pnpm exec esbuild --version` | 0 | Printed `0.27.3`. |
| shell | `bash -n scripts/cf.sh` | 0 | Syntax valid after comment update. |
| web build | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | 0 | OpenNext generated `.open-next/worker.js`; `patch-open-next-worker` injected auth env bridge. |
| api dry-run | `mise exec -- pnpm --filter @ubm-hyogo/api exec wrangler deploy --env staging --dry-run` | 0 | Wrangler 4.85.0 completed dry-run and exited before upload. |

Known warning: mise reports `.mise.toml` is not trusted in this worktree. Commands still executed successfully.


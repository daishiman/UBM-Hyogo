# Documentation Changelog

| Path | Change |
| --- | --- |
| `package.json` | Bumped `pnpm.overrides.esbuild` to `0.27.3`. |
| `pnpm-lock.yaml` | Regenerated after override bump. |
| `scripts/cf.sh` | Updated wrapper comment to include wrangler + OpenNext convergence. |
| `docs/30-workflows/fix-cf-deploy-esbuild-import-source-staging-failure/outputs/phase-*` | Added declared evidence outputs. |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | Retargeted current esbuild deploy recovery root. |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Retargeted current esbuild deploy recovery root. |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Retargeted current esbuild deploy recovery root. |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | Added current esbuild override SSOT note. |

## Commands

| Command | Result |
| --- | --- |
| `mise exec -- pnpm install --force` | exit 0 |
| `pnpm exec esbuild --version` | `0.27.3` |
| `pnpm why esbuild` | one version: `esbuild@0.27.3` |
| `mise exec -- pnpm typecheck` | exit 0 |
| `mise exec -- pnpm lint` | exit 0 |
| `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --dry-run --outdir /tmp/api-bundle` | exit 0 |
| `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | exit 1; blocked by local Miniflare/workerd SQLite readonly database startup, not by `import-source` |

# 2026-05-15 fix-wrangler-esbuild-import-source-error

- workflow root: `docs/30-workflows/completed-tasks/fix-wrangler-esbuild-import-source-error/`
- state: `implemented_local_evidence_captured / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`
- implementation: root `package.json#pnpm.overrides.esbuild` updated from `0.25.4` to `0.27.3`; `pnpm-lock.yaml` regenerated; `scripts/cf.sh` comment updated.
- verification: `pnpm install --frozen-lockfile=false`, `pnpm why esbuild`, `pnpm exec esbuild --version`, `apps/web build:cloudflare`, and `apps/api wrangler deploy --env staging --dry-run` passed locally.
- runtime boundary: GitHub Actions deploy-staging and runtime smoke remain user-gated for Phase 13.


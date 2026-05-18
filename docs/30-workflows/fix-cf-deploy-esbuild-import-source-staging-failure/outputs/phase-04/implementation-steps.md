# Phase 4 Implementation Steps

1. Update root `package.json#pnpm.overrides.esbuild` to exact `0.27.3`.
2. Run `mise exec -- pnpm install --force`.
3. Confirm `pnpm exec esbuild --version` prints `0.27.3`.
4. Confirm `pnpm why esbuild` reports one version.
5. Update `scripts/cf.sh` comments if the documented SSOT still points only to OpenNext.

## Executed In This Cycle

All five steps above were performed or prepared as tracked files in this worktree.

# Phase 10 Rollback

## Dependency Rollback

1. Change `package.json#pnpm.overrides.esbuild` from `0.27.3` back to the previous value.
2. Run `mise exec -- pnpm install --force`.
3. Confirm lockfile diff is limited to esbuild resolution.

## Script Comment Rollback

Revert only the `scripts/cf.sh` comment if the dependency rollback is selected. No executable shell behavior changed in this cycle.

## Deploy Rollback

If a deploy has already occurred, use the existing Cloudflare rollback path through `bash scripts/cf.sh rollback ...`; do not call `wrangler` directly.

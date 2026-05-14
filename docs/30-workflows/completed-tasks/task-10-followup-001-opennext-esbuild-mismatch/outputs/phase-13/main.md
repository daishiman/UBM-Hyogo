# Phase 13 Output: PR Draft

Status: pending_user_approval

## Draft Title

fix(build): pin esbuild via pnpm.overrides to recover build:cloudflare

## Draft Summary

- Pin workspace esbuild to `0.25.4` with root `pnpm.overrides`.
- Regenerate `pnpm-lock.yaml` so OpenNext host and platform binary versions converge.
- Preserve `scripts/cf.sh` wrapper behavior and document the recovery path.
- Capture build, dependency, typecheck, lint, wrapper, screenshot, and axe evidence.

## Test Plan

- `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare`
- `mise exec -- pnpm why esbuild`
- `mise exec -- pnpm typecheck`
- `mise exec -- pnpm lint`
- `CF_SH_SKIP_WITH_ENV=1 bash scripts/cf.sh --version`

PR creation, commit, and push were not executed.


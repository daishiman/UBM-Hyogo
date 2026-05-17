# Phase 3 Change Plan

## Implementation Files

| Path | Change |
| --- | --- |
| `package.json` | `pnpm.overrides.esbuild` changed from `0.25.4` to `0.27.3`. |
| `pnpm-lock.yaml` | Regenerated with `mise exec -- pnpm install --force`. |
| `scripts/cf.sh` | Comment updated so the SSOT is wrangler and OpenNext shared esbuild convergence, not OpenNext alone. |

## Excluded Changes

No API, D1 schema, Cloudflare Secret, or workflow pin changes are required for the adopted option.

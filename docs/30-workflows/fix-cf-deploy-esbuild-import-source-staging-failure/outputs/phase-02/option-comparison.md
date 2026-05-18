# Phase 2 Option Comparison

| Option | Decision | Reason |
| --- | --- | --- |
| A: bump `pnpm.overrides.esbuild` to `0.27.3` | adopted | Minimal change that preserves the override's original purpose and matches wrangler's current esbuild expectation. |
| B: bump wrangler | fallback only | Larger blast radius and unnecessary while option A resolves dependency convergence. |
| C: bump both | fallback only | Too much causal coupling for the first fix. |
| D: remove override | rejected | Reopens the OpenNext / wrangler host-binary mismatch risk documented in `scripts/cf.sh`. |

## Decision

Use exact `0.27.3`, not a range, so lockfile and review evidence remain deterministic.

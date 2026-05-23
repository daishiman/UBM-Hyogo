# Phase 11 NON_VISUAL Evidence Index

## Status

PASS_BOUNDARY_SYNCED_RUNTIME_PENDING.

The UT-15 workflow contract is fixed, but Cloudflare mutation, production curl traffic, and seven-day observation remain user-gated runtime operations. This file is the Phase 11 root evidence index required by `task-specification-creator`; it does not claim runtime apply success.

## Evidence Layers

| Layer | Evidence | Current state | Runtime handoff |
| --- | --- | --- | --- |
| L1 command contract | `scripts/cf-waf-apply.sh --dry-run` shape and exit codes | Specified in `phase-03.md`, `phase-04.md`, `phase-11.md` | Capture `cf-waf-apply-dry-run.json` after G1 approval |
| L2 local guard | `scripts/cf.sh` wrapper requirement and direct `wrangler` prohibition | Specified in Phase 3 / 11 / 13 | Re-run grep before apply |
| L3 in-memory/API fallback | 429 `{ error, retryAfterSec }` + `retry-after` contract | Specified in Phase 2 / 6 / 11 | Verify with vitest and miniflare in implementation cycle |
| L4 runtime observation | Security Events and false-positive rate | Runtime pending | Capture seven-day and 24h observation files after approval |

## Required Companion Files

- `manual-smoke-log.md`
- `link-checklist.md`

## Gate

No Cloudflare API mutation, production traffic generation, commit, push, or PR creation is authorized by this evidence file.

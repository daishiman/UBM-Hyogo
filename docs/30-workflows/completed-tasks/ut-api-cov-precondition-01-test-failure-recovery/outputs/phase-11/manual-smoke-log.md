# Phase 11 manual smoke log

- status: PASS
- evidence type: NON_VISUAL
- executed_at: 2026-05-01
- visual evidence: not required

## Smoke Results

| ID | command / check | result | evidence |
| --- | --- | --- | --- |
| S-1 | `cd apps/api && pnpm test` | PASS | Test Files 85 passed (85), Tests 523 passed (523) |
| S-2 | `cd apps/api && pnpm test:coverage` | PASS | `apps/api/coverage/coverage-summary.json` generated |
| S-3 | `bash scripts/coverage-guard.sh --no-run --package apps/api` | PASS | guard exit 0 at 80% threshold |
| S-4 | UI / screenshot requirement | N/A | NON_VISUAL test-fixture recovery; no UI change |

## Boundary

The precondition recovery gate is PASS. The 85% upgrade gate remains delegated to `ut-08a-01-public-use-case-coverage-hardening`.

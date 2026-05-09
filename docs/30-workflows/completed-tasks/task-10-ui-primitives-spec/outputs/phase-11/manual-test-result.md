# Phase 11 Manual Test Result

## Summary

State: `local_evidence_captured_runtime_visual_pending`

## Commands

| command | result | evidence |
| --- | --- | --- |
| `pnpm --filter @ubm-hyogo/web typecheck` | PASS | `outputs/phase-11/evidence/typecheck.log` |
| `pnpm --filter @ubm-hyogo/web lint` | PASS | `outputs/phase-11/evidence/lint.log` |
| `pnpm --filter @ubm-hyogo/web test apps/web/src/components/ui/__tests__/task10-contract.test.tsx apps/web/src/components/ui/__tests__/primitives.test.tsx` | PASS | `outputs/phase-11/evidence/test.log` |
| `pnpm --filter @ubm-hyogo/web test:coverage` | PASS | `outputs/phase-09/coverage.txt` |
| `pnpm --filter @ubm-hyogo/web build` | PASS | `outputs/phase-11/evidence/next-build.log` |
| `pnpm --filter @ubm-hyogo/web build:cloudflare` | FAIL | `outputs/phase-11/evidence/build.log` |

## Runtime Visual Boundary

Screenshot / axe / keyboard traversal are pending because Cloudflare build is blocked by the OpenNext esbuild host/binary mismatch.

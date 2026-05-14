# Phase 11 Manual Smoke Log

| command | expected | status |
|---------|----------|--------|
| `mise exec -- pnpm --filter @ubm-hyogo/api test contract-stage-2` | focused Vitest pass / fail 0 / skip 0 | PASS (2026-05-11) |
| `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | exit 0 | PASS (2026-05-11) |
| `mise exec -- pnpm lint` | exit 0 | PASS (2026-05-11) |
| `grep -E 'z\\.object\\(' apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` | 0 hits | PASS (2026-05-11) |
| `grep -E '\\b(test|it|describe)\\.skip' apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` | 0 hits | PASS (2026-05-11) |

## Exit Code Handling

When the implementation cycle runs these commands, use `set -o pipefail` before piping to `tee` so the command exit code is preserved.

# Phase 11 Test Report

VisualEvidence: NON_VISUAL.

## Executed

| Command | Result |
| --- | --- |
| `pnpm --filter @ubm-hyogo/shared test -- --runInBand=false` | PASS: 14 files / 166 tests |
| `pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/routes/admin/tags-queue.test.ts apps/api/src/workflows/tagQueueResolve.test.ts apps/api/src/schemas/tagQueueResolve.test.ts` | PASS: 3 files / 31 tests |
| `pnpm --filter @ubm-hyogo/api typecheck && pnpm --filter @ubm-hyogo/web typecheck && pnpm --filter @ubm-hyogo/shared typecheck` | PASS |

Node engine warning observed: required Node 24.x, local Node v22.21.1.

Non-blocking failed attempt: `pnpm --filter @ubm-hyogo/api test -- tags-queue tagQueueResolve`
selected the full `apps/api` suite through the package script and failed with Miniflare/D1
`EADDRNOTAVAIL` port exhaustion after 72 files / 425 tests passed and 9 files / 61 tests failed.
The focused target command above isolates this task's contract surface.

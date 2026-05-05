# Phase 9: 品質保証

## Commands

| Command | Result |
| --- | --- |
| `pnpm --filter @ubm-hyogo/shared test -- --runInBand=false` | PASS: 14 files / 166 tests |
| `pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/routes/admin/tags-queue.test.ts apps/api/src/workflows/tagQueueResolve.test.ts apps/api/src/schemas/tagQueueResolve.test.ts` | PASS: 3 files / 31 tests |
| `pnpm --filter @ubm-hyogo/api typecheck` | PASS |
| `pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| `pnpm --filter @ubm-hyogo/shared typecheck` | PASS |

Note: local Node is v22.21.1, so pnpm emitted the project engine warning for required Node 24.x.
An overly broad API package-script invocation selected the full `apps/api` suite and failed with
Miniflare/D1 `EADDRNOTAVAIL` port exhaustion. The focused target command above exited 0.

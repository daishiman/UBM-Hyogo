# Phase 11 NON_VISUAL Evidence

## Evidence Set

| Evidence | Status | Source |
| --- | --- | --- |
| focused Vitest | captured | `pnpm --filter @ubm-hyogo/api exec vitest run --root=../.. --config=vitest.config.ts apps/api/src/workflows/tagCandidateEnqueue.test.ts` |
| Forms sync propagation Vitest | captured | `pnpm --filter @ubm-hyogo/api exec vitest run --root=../.. --config=vitest.config.ts apps/api/src/jobs/sync-forms-responses.test.ts` |
| pause guard grep | captured | `rg "TAG_QUEUE_PAUSED|parsePaused|UBM-TAGQ-PAUSED" apps/api/src apps/api/wrangler.toml` |
| runbook existence | captured | `docs/30-workflows/runbooks/tag-queue-pause.md` |

Runtime Cloudflare deploy / D1 inspection is not executed in this phase because production mutation remains user-gated.

## Captured Results

| Command | Result |
| --- | --- |
| `pnpm --filter @ubm-hyogo/api exec vitest run --root=../.. --config=vitest.config.ts apps/api/src/workflows/tagCandidateEnqueue.test.ts` | PASS: 1 file / 13 tests |
| `pnpm --filter @ubm-hyogo/api exec vitest run --root=../.. --config=vitest.config.ts apps/api/src/jobs/sync-forms-responses.test.ts` | PASS: 1 file / 16 tests |

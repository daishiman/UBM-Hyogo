# Non-visual Evidence

## Scope

Issue #378 is `implementation / NON_VISUAL`. It changes API Worker env/config, Forms sync enqueue behavior, tests, and documentation. No browser UI or screenshot evidence is required.

## Evidence

| Check | Evidence |
| --- | --- |
| Pause parser | `parsePaused` returns true only for `TAG_QUEUE_PAUSED = "true"` |
| Enqueue guard | Paused path returns `{ enqueued: false, reason: "paused" }` before D1 read/write |
| Forms sync propagation | `runResponseSync` with `TAG_QUEUE_PAUSED = "true"` still writes identity / response / status rows but creates zero `tag_assignment_queue` rows |
| Structured log | Paused path emits `UBM-TAGQ-PAUSED` with `reason: "paused"` |
| Default behavior | unset and `"false"` keep enqueue enabled |
| Runbook | `docs/30-workflows/runbooks/tag-queue-pause.md` documents pause, verification, and recovery |

Focused evidence is implemented in `apps/api/src/workflows/tagCandidateEnqueue.test.ts` and `apps/api/src/jobs/sync-forms-responses.test.ts`.

## Focused Test Commands

```bash
pnpm --filter @ubm-hyogo/api exec vitest run --root=../.. --config=vitest.config.ts apps/api/src/workflows/tagCandidateEnqueue.test.ts
pnpm --filter @ubm-hyogo/api exec vitest run --root=../.. --config=vitest.config.ts apps/api/src/jobs/sync-forms-responses.test.ts
```

## Captured Results

| Test file | Result |
| --- | --- |
| `apps/api/src/workflows/tagCandidateEnqueue.test.ts` | PASS: 13 tests |
| `apps/api/src/jobs/sync-forms-responses.test.ts` | PASS: 16 tests |

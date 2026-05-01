# Phase 2 Output: Canonical Set Decision

## Adopted Canonical Values

### `status`

| Value | Meaning | Terminal |
| --- | --- | --- |
| `pending` | Job accepted but not started | No |
| `in_progress` | Job is running | No |
| `completed` | Job finished successfully | Yes |
| `failed` | Job failed | Yes |
| `skipped` | Job was intentionally skipped | Yes |

### `trigger_type`

| Value | Meaning |
| --- | --- |
| `manual` | Human/API/CLI initiated run |
| `cron` | Scheduled run |
| `backfill` | Historical replay |

Actor information is not encoded in `trigger_type`. Existing `admin` becomes `trigger_type='manual'` with `triggered_by='admin'`.

## Alternatives

| Axis | Alternative | Decision | Reason |
| --- | --- | --- | --- |
| status | 4 values, fold `skipped` into `completed` | Rejected | Requires every success metric to filter skip reason |
| status | 6 values, add `canceled` | Rejected | Future feature, unnecessary for current contract |
| trigger | Keep `admin` | Rejected | Mixes who-axis and how-axis |
| trigger | `manual:admin` style strings | Rejected | Expands value space and forces parsing |

## Rewrite Target List

| File | Existing value | Canonical action | Owner |
| --- | --- | --- | --- |
| `apps/api/src/jobs/sync-sheets-to-d1.ts` | `running` | Replace with `in_progress` | UT-09 |
| `apps/api/src/jobs/sync-sheets-to-d1.ts` | `success` | Replace with `completed` | UT-09 |
| `apps/api/src/jobs/sync-sheets-to-d1.ts` | `admin` | Replace with `manual` and set `triggered_by='admin'` | UT-09 |
| `apps/api/migrations/0002_sync_logs_locks.sql` | no enum CHECK | Add canonical CHECK in a later migration | UT-04 |
| `packages/shared/src/types/sync.ts` | absent | Add `SyncStatus` and `SyncTriggerType` | U-UT01-10 |
| `packages/shared/src/zod/sync.ts` | absent | Add runtime schemas | U-UT01-10 |

## 4 Condition Check

| Condition | Result |
| --- | --- |
| No contradictions | PASS |
| No omissions | PASS |
| Consistent | PASS |
| Dependency aligned | PASS |

# Phase 5 Output: Rewrite Target List

This list is intentionally line-numbered so UT-04 / UT-09 / U-UT01-10 can consume it without re-discovering the enum drift. Line numbers are current as of 2026-04-30 and must be re-grepped before implementation.

| Target | Current lines | Current drift | Change type | Delegated task |
| --- | ---: | --- | --- | --- |
| `apps/api/src/jobs/sync-sheets-to-d1.ts` | 29 | `trigger: "cron" | "admin" | "backfill"` | Replace `admin` trigger with canonical `manual`; preserve actor separately if needed | UT-09 |
| `apps/api/src/jobs/sync-sheets-to-d1.ts` | 37, 118, 146, 156, 313, 337-343, 369-382 | `success` / `failed` / `skipped` result and `running` DB row | Rewrite writer literals to `pending` / `in_progress` / `completed` / `failed` / `skipped` | UT-09 |
| `apps/api/src/jobs/sync-sheets-to-d1.test.ts` | 85, 134-149, 153-183, 195-215 | fixtures and expectations use `running` / `success` / `admin` | Update contract tests after writer rewrite | UT-09 |
| `apps/api/src/jobs/sync-lock.ts` | 14, 39 | `triggerType: "cron" | "admin" | "backfill"` and `sync_locks.trigger_type` insert | Include `sync_locks` in `admin -> manual` migration; lock table is mechanism-only after canonicalization | UT-04 / UT-09 |
| `apps/api/src/sync/types.ts` | 1, 4, 6, 17 | `manual` / `scheduled` / `backfill`; `AuditStatus = "running" | "success" | "failed" | "skipped"` | Align sync layer logical trigger and audit status with canonical set or document compatibility adapter | UT-09 / U-UT01-10 |
| `apps/api/src/sync/audit.ts` | 2, 26-29, 48-61, 75-88, 114-153, 181-202 | `manual -> admin`, `running`, `success`, `failed`, `skipped` | Rewrite audit writer/reader literals and preserve compatibility mapping in one place | UT-09 |
| `apps/api/src/sync/audit.test.ts` | 21-31, 34-49, 49-80, 87-135 | test expectations use `running` / `success` / `failed` / `skipped` | Update tests with canonical values | UT-09 |
| `apps/api/src/sync/manual.test.ts` | 22-40 | manual route expects `success` in `sync_job_logs` | Update route assertions | UT-09 |
| `apps/api/src/sync/scheduled.ts` | 2-3, 15 | cursor reads `status='success'` and trigger aliases `manual`,`scheduled`,`admin`,`cron` | Query canonical `completed`; remove actor alias from mechanism filter | UT-09 |
| `apps/api/src/sync/scheduled.test.ts` | 16-24, 52-58 | fixture rows use `success`, `scheduled`, `manual` | Update scheduled cursor tests | UT-09 |
| `apps/api/src/sync/audit-route.test.ts` | 14-15 | audit route fixture uses `trigger_type='manual'`, `status='success'` | Update fixture status to canonical `completed` | UT-09 |
| `apps/api/migrations/0002_sync_logs_locks.sql` | 11, 17-18, 30 | comments define `cron / admin / backfill` and `running / success / failed / skipped`; index on `status` | Add conversion UPDATE before CHECK constraints for both `sync_job_logs` and `sync_locks` | UT-04 |
| `packages/shared/src/types/viewmodel/index.ts` | 89-90 | dashboard view model uses `running` for sync status | Consumer audit; decide whether this is generic UI state or sync enum and update if sync-specific | U-UT01-08-FU-01 |
| `packages/shared/src/types/sync.ts` | new file | missing canonical union types | Add `SyncStatus` and `SyncTriggerType` | U-UT01-10 |
| `packages/shared/src/zod/sync.ts` | new file | missing runtime schemas | Add Zod schemas and type exports | U-UT01-10 |
| `apps/web/**` / monitoring queries | TBD | status labels and aggregation may still match `running` / `success` / `admin` | Consumer audit across UI and monitoring | U-UT01-08-FU-01 |

## Canonical Literal Search Set

`running`, `success`, `failed`, `skipped`, `admin`, `manual`, `cron`, `backfill`, `pending`, `in_progress`, `completed`.

## `sync_locks` Decision

`sync_locks.trigger_type` participates in canonicalization. After migration it should store mechanism values only: `manual` / `cron` / `backfill`. Existing `admin` lock rows convert to `manual`; actor identity is not stored in `sync_locks`.

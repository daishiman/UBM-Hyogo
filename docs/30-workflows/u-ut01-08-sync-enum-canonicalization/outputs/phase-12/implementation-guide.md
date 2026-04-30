# Phase 12 Output: Implementation Guide

## Part 1: Middle School Level

Imagine three people record the same result with different words: `success`, `completed`, and `done`.
When someone counts completed jobs, one group might be missed. This task chooses one official word list so later tasks count and display the data consistently.

`admin` is also split. It tells us who started the job, not how the job was started. The official trigger value is `manual`; the actor can be stored separately as `triggered_by='admin'`.

## Part 2: Technical Guide

```ts
export type SyncStatus = "pending" | "in_progress" | "completed" | "failed" | "skipped";
export type SyncTriggerType = "manual" | "cron" | "backfill";
```

```sql
UPDATE sync_job_logs SET status = 'in_progress' WHERE status = 'running';
UPDATE sync_job_logs SET status = 'completed' WHERE status = 'success';
UPDATE sync_job_logs
SET trigger_type = 'manual', triggered_by = 'admin'
WHERE trigger_type = 'admin';
```

Implementation ownership:

| Area | Owner |
| --- | --- |
| D1 migration | UT-04 |
| sync job rewrite | UT-09 |
| shared types and Zod schemas | U-UT01-10 |
| UI / monitoring consumer audit | U-UT01-08-FU-01 |

## Evidence References

| Evidence | Path |
| --- | --- |
| NON_VISUAL Phase 11 summary | `outputs/phase-11/main.md` |
| NON_VISUAL walkthrough log | `outputs/phase-11/manual-evidence.md` |
| Link checklist | `outputs/phase-11/link-checklist.md` |
| Line-numbered rewrite targets | `outputs/phase-05/rewrite-target-list.md` |

No screenshots are referenced because this is a docs-only / NON_VISUAL contract task with no UI route changes.

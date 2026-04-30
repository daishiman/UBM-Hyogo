# Phase 2 Output: Value Mapping Table

## `status` Mapping

| Existing value | Canonical value | Pseudo SQL |
| --- | --- | --- |
| `running` | `in_progress` | `UPDATE sync_job_logs SET status='in_progress' WHERE status='running';` |
| `success` | `completed` | `UPDATE sync_job_logs SET status='completed' WHERE status='success';` |
| `failed` | `failed` | No change |
| `skipped` | `skipped` | No change |
| new rows only | `pending` | Insert before work starts |

## `trigger_type` Mapping

| Existing value | Canonical value | Actor value | Pseudo SQL |
| --- | --- | --- | --- |
| `manual` | `manual` | caller-specific | No value conversion |
| `admin` | `manual` | `admin` | `UPDATE sync_job_logs SET trigger_type='manual', triggered_by='admin' WHERE trigger_type='admin';` |
| `cron` | `cron` | `system` or NULL | No value conversion |
| `backfill` | `backfill` | NULL or operator | No value conversion |

## Migration Ordering

1. Add `triggered_by` as nullable metadata if absent.
2. Convert existing values.
3. Add or recreate CHECK constraints for canonical values.
4. Update code writers and readers in UT-09.

No SQL in this document is to be executed by U-UT01-08.

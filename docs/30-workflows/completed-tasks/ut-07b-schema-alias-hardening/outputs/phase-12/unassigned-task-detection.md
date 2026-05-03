# Unassigned Task Detection

Status: completed

Detected follow-up candidates:

| Candidate | Trigger | Handling |
| --- | --- | --- |
| queue/cron split for large back-fill | 50,000+ rows persistently exceed CPU budget | formalized as `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-schema-alias-backfill-queue-cron-split.md`; execute only if staging evidence proves repeated exhaustion |
| admin UI retry label | operators need visible retry semantics | formalized as `docs/30-workflows/unassigned-task/task-ut-07b-fu-02-admin-schema-alias-retry-label.md`; UI surface remains outside UT-07B hardening |
| production migration apply runbook | post-merge operational execution | runbook formalized as `docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/`; actual apply execution formalized as `docs/30-workflows/unassigned-task/task-ut-07b-fu-04-production-migration-apply-execution.md` |

Review disposition:

- `backfill_status='exhausted'` continuation visibility was handled in this wave by listing queued diffs plus unfinished back-fill diffs from `schemaDiffQueue.list()`.
- Cursor semantics remain an idempotent remaining-scan model. A real cursor implementation is not mandatory unless staging 10,000+ row evidence shows repeated CPU exhaustion.
- Mandatory follow-ups are now explicit: queue/cron split and admin retry label are formalized follow-up tasks; production migration apply is split into FU-03 runbook formalization plus FU-04 approval-gated execution. This parent detection file is no longer the active source for "not formalized" wording.

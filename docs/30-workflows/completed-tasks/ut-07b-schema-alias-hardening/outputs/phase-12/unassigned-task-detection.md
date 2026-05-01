# Unassigned Task Detection

Status: completed

Detected follow-up candidates:

| Candidate | Trigger | Handling |
| --- | --- | --- |
| queue/cron split for large back-fill | 50,000+ rows persistently exceed CPU budget | conditional hold; formalize only if staging evidence proves repeated exhaustion |
| admin UI retry label | operators need visible retry semantics | not formalized in this wave; API contract is sufficient and no UI surface changed |
| production migration apply runbook | post-merge operational execution | not formalized as unassigned implementation; approval-gated operation after Phase 13 |

Review disposition:

- `backfill_status='exhausted'` continuation visibility was handled in this wave by listing queued diffs plus unfinished back-fill diffs from `schemaDiffQueue.list()`.
- Cursor semantics remain an idempotent remaining-scan model. A real cursor implementation is not mandatory unless staging 10,000+ row evidence shows repeated CPU exhaustion.
- No additional mandatory task is created in this turn. The only large follow-up remains queue/cron split, gated by staging evidence.

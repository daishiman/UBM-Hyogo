# migration-list.md

Status: `PENDING_USER_APPROVAL`

Expected command:

```bash
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
```

Expected result: `0001_init.sql` and `0005_response_sync.sql` remain applied, with no new pending migration caused by comment-only edits.

Observed result: not executed in this turn. This command requires production Cloudflare/D1 environment access and is intentionally deferred to the user-approved Phase 13 operation. PR readiness must keep this item pending until that evidence is captured.

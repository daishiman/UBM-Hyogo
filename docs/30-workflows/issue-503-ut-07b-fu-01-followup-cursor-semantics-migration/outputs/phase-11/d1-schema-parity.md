# Phase 11 D1 Schema Parity

## Status

`PENDING_USER_GATE`.

This file records staging vs production D1 schema parity for the cursor experiment. It must not be marked PASS until runtime evidence is collected after explicit user approval.

## Required Commands

```bash
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "PRAGMA table_info(schema_diff_queue);"
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command "PRAGMA table_info(schema_diff_queue);"
```

## Expected Boundary

Cursor adoption may apply `0015_schema_diff_queue_cursor.sql` to staging for evidence. Production apply remains user-gated and outside this Phase 11 runtime evidence capture.

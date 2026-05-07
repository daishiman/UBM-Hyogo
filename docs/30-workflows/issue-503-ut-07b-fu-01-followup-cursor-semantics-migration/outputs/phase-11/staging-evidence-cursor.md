# Phase 11 Evidence: cursor

## Status

`PENDING_USER_GATE`.

This file is the required NON_VISUAL evidence target for the cursor runtime trial. It is intentionally not marked PASS because staging deploy, fixture insertion, queue execution, and runtime metric collection require explicit user approval.

## Required Measurements

| Evidence | Required value |
| --- | --- |
| Fixture size | 10,000 rows |
| Mode | `BACKFILL_CURSOR_MODE=cursor` |
| CPU time | 5 batch average and cumulative value |
| Remaining rows | Count after each batch |
| retry_count | Delta across the trial |
| Query plan | `EXPLAIN QUERY PLAN` for the cursor `response_fields(stable_key, id)` lookup |
| DLQ | Insert count / no-insert evidence |

## Query Plan Target

The measured query must match the repository path under comparison:

```sql
EXPLAIN QUERY PLAN
SELECT rf.id, rf.response_id, rf.stable_key
FROM response_fields rf
WHERE rf.stable_key = 'sample_stable_key'
  AND rf.id > 0
ORDER BY rf.id ASC
LIMIT 20;
```

## Result

Runtime evidence is pending user approval.

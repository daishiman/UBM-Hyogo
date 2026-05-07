# Phase 11 Decision Record

## Status

`PENDING_USER_GATE`.

No adoption decision is recorded until the required staging runtime evidence files are populated.

## Canonical Rule

Phase 1 is the only adoption-rule SSOT.

| Evidence | Adoption requirement |
| --- | --- |
| E1 CPU time | cursor average CPU time is at least 30% lower than remaining-scan |
| E4 query plan | cursor path uses `SEARCH ... USING INDEX` for the measured `response_fields(stable_key, id)` lookup |
| E2 remaining rows | Supplementary only |
| E3 retry_count | Supplementary only |

Decision values:

- `cursor_adopted`
- `remaining_scan_fixed`
- `cursor_decision_deferred`

## Result

Decision pending user-approved runtime evidence.

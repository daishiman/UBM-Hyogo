# Rollback Readiness Evidence Contract

## Status

`PENDING_IMPLEMENTATION_FOLLOW_UP`

## Boundary

Rollback is not executed in this spec-created workflow. This file fixes the evidence shape so the implementation follow-up cannot claim production readiness without a version id and route rollback path.

## Required Evidence On Execution

| Item | Required value |
| --- | --- |
| Previous Workers version id | recorded append-only before production promotion |
| Rollback command | documented with environment-specific script name |
| Pages dormant window | minimum observation period and delete approval are separate from deploy cutover |
| NO-GO condition | missing previous version id, unresolved route conflict, or unverified custom domain |


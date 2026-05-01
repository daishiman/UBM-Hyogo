# Phase 6: 異常系検証

## Failure Cases

| Case | Expected | Evidence |
| --- | --- | --- |
| no auth | 401 | existing route test |
| invalid json | 400 `invalid json body` | route behavior retained |
| schema validation | 400 `validation_error` | empty reason + mixed body tests |
| queue missing | 404 `queue_not_found` | route test |
| state conflict | 409 `state_conflict` | confirmed -> rejected test |
| unknown tag | 422 `unknown_tag_code` | route test |
| deleted member | 422 `member_deleted` | route test |

## Invariants

| Invariant | Result |
| --- | --- |
| #5 apps/web -> D1 direct access prohibited | PASS: only admin proxy client touched |
| #11 admin cannot edit member body | PASS: resolve path writes only queue/member_tags/audit |
| #13 no direct tag mutation | PASS: `resolveTagQueue` remains the only tag mutation export |


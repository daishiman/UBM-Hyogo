# Phase 4: テスト戦略

## Verify Suite

| Test ID | Layer | Scenario | Expected |
| --- | --- | --- | --- |
| U-01 | shared schema | confirmed + tagCodes | parse success |
| U-02 | shared schema | rejected + reason | parse success |
| U-03 | shared schema | empty tagCodes / empty reason | parse failure |
| U-04 | shared schema | missing / unknown discriminator | parse failure |
| U-05 | shared schema | mixed confirmed/rejected keys | parse failure |
| C-01 | API route | confirmed first submit | 200, `status:"resolved"`, `idempotent:false` |
| C-02 | API route | rejected first submit | 200, `status:"rejected"`, `idempotent:false` |
| C-03 | API route | confirmed same payload replay | 200, `idempotent:true`, audit unchanged |
| C-04 | API route | rejected same payload replay | 200, `idempotent:true`, audit unchanged |
| C-05 | API route | confirmed -> rejected | 409 `state_conflict` |
| C-06 | API route | unknown tag code | 422 `unknown_tag_code` |
| A-01 | API route | unauthenticated | 401 |

## Fixture Design

| Table | Seed |
| --- | --- |
| `tag_definitions` | `tag_1 / tag-1` |
| `tag_assignment_queue` | `q1 / m1 / queued` |
| `member_status` | `m1 / is_deleted=0` |
| `audit_log` | asserted after resolve |

E2E / staging smoke は UT-07A-03 に委譲。


# Phase 6 Output: Edge Cases

## Result

Status: completed as docs-only edge-case design.

## Edge Cases

| Case | Handling |
| --- | --- |
| Orphan route points to legacy Worker | block deploy approval and record route migration plan |
| Extra secret key exists | record key name only; deletion is separate approval |
| Missing secret key exists | block deploy approval until reinjection plan is approved |
| Tail produces no request | confirm route target, generate one approved request after deploy, or mark deploy smoke incomplete |
| Rollback path depends on legacy Worker | retain legacy Worker until stable cutover |
| DNS cutover is required | delegate to UT-16; do not perform here |

## 4 Condition Check

| Condition | Result |
| --- | --- |
| No contradiction | PASS |
| No omissions | PASS |
| Consistency | PASS |
| Dependency integrity | PASS |

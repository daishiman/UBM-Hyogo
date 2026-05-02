# outputs phase 06: ut-api-cov-precondition-01-test-failure-recovery

- status: specification_prepared
- purpose: F01-F13 の root cause summary と異常系検証観点を固定する
- measurement_status: root cause は実装時に確定する。現時点は suspected cause / required check であり PASS ではない

## root cause buckets

- F01-F04: form payload、response identity、responseEmail、fixture drift
- F05: schema alias `question_not_found`
- F06: tag queue status transition / alias
- F07: D1 seed、memberId scope、soft delete
- F08-F12: session missing、role mismatch、401/403 contract
- F13: unresolved async hook / timer / promise cleanup

## abnormal checks

- null / empty input
- D1 failure and redacted error
- auth 401 vs role 403
- network / fetch failure retryability
- timeout recovery without timeout inflation

## handoff

Phase 7 へ、root cause buckets、異常系 checklist、pending evidence の扱いを渡す。

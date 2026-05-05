# outputs phase 03: ut-api-cov-precondition-01-test-failure-recovery

- status: specification_prepared
- purpose: Phase 2 設計を不変条件と coverage integrity の観点でレビューする
- measurement_status: 未実測。レビュー上の PASS は runtime PASS ではない

## レビュー固定事項

- F01-F13 の漏れ・重複を Phase 1 inventory に対して確認する
- responseEmail system field、responseId/memberId separation、public/member/admin boundary、apps/web D1 direct access forbidden を維持する
- skip/todo、threshold 緩和、coverage exclude 追加による数値合わせを禁止する
- 未実装・未実測は `DEFERRED_TO_IMPLEMENTATION` または `pending` として扱う

## handoff

Phase 4 へ、レビュー済み inventory、coverage integrity 禁止事項、未実測を PASS にしない判定語彙を渡す。

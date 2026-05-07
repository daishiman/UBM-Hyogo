# Phase 05 — テスト実装 / Test Implementation

`apps/api/src/workflows/tagCandidateEnqueue.test.ts` に以下のケースを追加（実装済み）。

- `TAG_QUEUE_PAUSED 未設定で enqueue される`
- `TAG_QUEUE_PAUSED="false" で enqueue される`
- `TAG_QUEUE_PAUSED="true" で D1 に触らず paused reason と structured log を返す`
  - `vi.spyOn(env.db, "prepare")` が呼ばれない
  - `console.warn` が 1 回呼ばれ、引数 JSON に `"code":"UBM-TAGQ-PAUSED"` と `"reason":"paused"` を含む
- `parsePaused` の `it.each` で 5 値分（unset / false / true / True / 1）の strict 解釈

TDD としては実装前に red を確認する想定だが、本タスクは spec → impl → test を一括で纏めて green に到達。テスト追加分も含め、apps/api 全体で 789 件 PASS（Phase 09 quality-report を参照）。

# Phase 07 — AC マトリクス / Acceptance Matrix

| AC | 検証方法 | 結果 |
| --- | --- | --- |
| AC-1: env binding 3 値解釈 | `parsePaused` の `it.each`（unset/false/true/True/1） | PASS |
| AC-2: paused=true で INSERT 非発行 + paused reason | `vi.spyOn(env.db, "prepare").not.toHaveBeenCalled()` + 戻り値 `{ enqueued: false, reason: "paused" }` | PASS |
| AC-3: structured log（code / reason） | `console.warn` spy が `"code":"UBM-TAGQ-PAUSED"` と `"reason":"paused"` を含む JSON で 1 回呼出 | PASS |
| AC-4: runbook 新設 | `docs/30-workflows/runbooks/tag-queue-pause.md` 存在 | PASS |
| AC-5: unit test PASS | `pnpm --filter @ubm-hyogo/api test` で 789/789 PASS | PASS |
| AC-6: 不変条件 #5 / #13 | D1 アクセスは apps/api 内のみ。`member_tags` への直接書き込みなし | PASS |

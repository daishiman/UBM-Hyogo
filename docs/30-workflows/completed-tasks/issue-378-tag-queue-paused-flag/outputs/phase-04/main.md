# Phase 04 — テスト戦略 / Test Strategy

`apps/api/src/workflows/tagCandidateEnqueue.test.ts` に追加する観点:

| 観点 | 期待 |
| --- | --- |
| `parsePaused({})` | false |
| `parsePaused({ TAG_QUEUE_PAUSED: "false" })` | false |
| `parsePaused({ TAG_QUEUE_PAUSED: "true" })` | true |
| strict 検証: `"True"`, `"1"` | false（誤入力で誤停止しない） |
| 既存 enqueue 経路 (paused 未指定) | 既存 AC-8 / has_tags / has_pending_candidate / 冪等性が継続 PASS |
| paused=true の挙動 | D1 `prepare` 未呼出 + `{ enqueued: false, reason: "paused" }` + `console.warn` 1 回 + JSON に `"code":"UBM-TAGQ-PAUSED"` と `"reason":"paused"` を含む |

実装方針: vitest `vi.spyOn(env.db, "prepare")` で D1 非呼出を検証、`vi.spyOn(console, "warn")` で structured log を検証。

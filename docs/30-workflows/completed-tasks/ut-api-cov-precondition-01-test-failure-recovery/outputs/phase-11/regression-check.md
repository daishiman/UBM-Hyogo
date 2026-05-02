# Phase 11 regression check

- status: PASS
- evidence type: NON_VISUAL
- baseline: Test Files 10 failed | 75 passed (85), Tests 13 failed | 510 passed (523)
- 実測 (2026-05-01): Test Files 85 passed (85), Tests 523 passed (523)
- 判定: 510 → 519（既存 PASS）+ 4（F01-F04 回復）= 523 全 PASS。 regression なし。

## diff 範囲

| 観点 | 修正対象 | 影響範囲 |
| --- | --- | --- |
| `apps/api/src/jobs/__fixtures__/d1-fake.ts` | tag_assignment_queue の SELECT/INSERT 経路を fake に追加 | テストフィクスチャのみ。runtime production code 非影響。 |

## 検証コマンド

```bash
cd apps/api && mise exec -- pnpm test
```

結果: `Test Files  85 passed (85)` / `Tests  523 passed (523)` / Duration 149.74s。

## 不変条件 review

- #1 responseEmail system field: runtime production code に変更なし。
- #2 responseId/memberId separation: runtime production code に変更なし。
- #5 public/member/admin boundary: 影響なし。
- #6 apps/web D1 direct access forbidden: apps/web 非編集。
- 02-auth.md / 03-data-fetching.md と矛盾なし（編集対象は `apps/api/src/jobs/__fixtures__/d1-fake.ts` のみ）。

## Regression rule

Any newly failing test outside the known 13 failures is a regression and blocks Phase 13 approval. → 該当なし。

# Phase 7 — AC マトリクス 主成果物

`ac-matrix.md` を参照。

## 不変条件 → AC 逆引き

| 不変条件 | 対応 AC |
| --- | --- |
| #1 | AC-3 (editResponseUrl null fallback) |
| #4 | AC-3, AC-4 (response_fields 不変) |
| #5 | 構造的に保証 (本タスクは apps/api のみ) |
| #7 | AC-5 (memberId / responseId 別フィールド) |
| #8 | 構造的に保証 (cookie/JWT のみ) |
| #9 | AC-7 (authGateState 5 状態のうち 3 状態) |
| #11 | AC-1, AC-2, AC-6 |
| #12 | AC-4, AC-8 |

## トレース完全性チェック

- [x] AC-1〜AC-8 のすべてに verify suite が紐づく (index.test.ts 14 ケース)
- [x] AC-1〜AC-8 のすべてに runbook step が紐づく
- [x] F-1〜F-15 のすべてが少なくとも 1 つの AC に紐づく
- [x] 不変条件 #1, #4, #5, #7, #8, #9, #11, #12 がすべて AC か構造で保証

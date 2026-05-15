# Phase 10: 最終レビュー

> Phase: 10 / 13
> 名称: 最終レビュー

---

## acceptance criteria 判定

| DoD 項目 | 判定基準 |
|---------|---------|
| `MVP-3LAYER-TASK-MAPPING.md` 配置 | path 確認 |
| 2 セクション（双方向 matrix）存在 | 見出し確認 |
| 88 セルすべて埋まり | TC-03 PASS |
| WARN/FAIL 影響層明示 | TC-05 PASS |
| 双方向一致 | TC-04 / TC-11 PASS |
| 既存ファイル未変更 | TC-07 PASS |
| line budget ≤ 600 | TC-09 PASS |

---

## MINOR 指摘の扱い（重要）

Phase 10 で MINOR 判定の指摘が発生した場合、機能に影響なしであっても **未タスク化の対象**とする（unassigned-task-detection.md に登録）。「機能に影響なし」は不要判定の理由にならない。

---

## blocker 判定

- BLOCKING: 必須タスク（task-23 など）の前提資料が存在しないまま matrix を確定した場合
- NON-BLOCKING: 表記揺れ / 脚注の体裁 / 並び順の好み

---

## 完了条件

- DoD 全項目 PASS
- MINOR 指摘があれば Phase 12 で未タスク化
- Phase 11 へ進行可能
## メタ情報

- Phase: 10 / 最終レビュー
- taskType: docs-only
- visualEvidence: NON_VISUAL

## 目的

acceptance criteria を最終確認する。

## 実行タスク

- final deliverable の存在を確認する。
- 4 条件の最終判定へ入力を渡す。

## 参照資料

- `phase-1-requirements.md`
- `outputs/phase-7/coverage.md`

## 成果物

- `phase-10-final-review.md`

## 完了条件

- [x] final review の判定が記録されている。

## 統合テスト連携

runtime test は不要。Phase 11 代替証跡へ接続する。

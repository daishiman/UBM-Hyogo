# Phase 10: 最終レビュー

## acceptance criteria 判定

| # | 受入条件 | 判定 | 根拠 |
|---|----------|------|------|
| 1 | `VERIFICATION-STATUS.md` が指定パスに存在 | TBD | Phase 5 完了後に判定 |
| 2 | 22 × 4 = 88 セルすべて埋まり率 100% | TBD | Phase 7 で計測 |
| 3 | WARN/FAIL に理由付与 100% | TBD | Phase 9 で確認 |
| 4 | GFM 構文有効 | TBD | Phase 9 で確認 |
| 5 | 凡例 / 評価日付 / 評価者 / 参照 commit セクション存在 | TBD | Phase 5 出力時に検証 |
| 6 | サマリーが末尾に存在 | TBD | Phase 5 出力時に検証 |

> 注: 本 Phase の判定は Phase 5 出力後に確定する。設計段階では「Phase 5 が DoD を満たす作業手順を持つ」ことを確認済み（Phase 3 で GO 判定）。

---

## MINOR 指摘（未タスク化候補）

| # | 指摘 | 未タスク化対応 |
|---|------|----------------|
| 1 | matrix の評価ロジックを将来スクリプト化（`scripts/verify-matrix.ts`）したい | 未タスク化候補（task-23 のスコープ外） |

→ Phase 12 Task 4（unassigned-task-detection.md）に登録する。

---

## blocker

なし。

---

## 判定

**GO（Phase 11 へ進行可）**

---

## 成果物

- `outputs/phase-10/final-review.md`

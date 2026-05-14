# Phase 7: カバレッジ確認

## 目的

docs-only タスクのため、コードカバレッジの代わりに「matrix 埋まり率 100%」を担保する。

---

## 1. カバレッジ指標

| 指標 | 目標 | 計測方法 |
|------|------|----------|
| 行カバレッジ（22 行） | 100% | `awk` で `^\| task-NN ` を数えて 22 行 |
| 列カバレッジ（4 条件） | 100% | header 行に C1 / C2 / C3 / C4 が現れること |
| セル充足率 | 100%（88/88） | PASS/WARN/FAIL/N/A の出現回数を集計 |
| 理由付与率（WARN/FAIL） | 100% | WARN/FAIL の行で「備考」が非空であること |

---

## 2. 計測スコープ

対象ファイル: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/VERIFICATION-STATUS.md` のみ。

本ワークフロー内の他 Phase outputs はカバレッジ対象外（spec 内ドキュメント）。

---

## 3. 期待結果

- 88 セルすべて埋まり率 100%
- 未確認セル（「未確認」「TBD」「TODO」等の文字列）が 0 件

---

## 4. 成果物

- `outputs/phase-7/coverage.md`

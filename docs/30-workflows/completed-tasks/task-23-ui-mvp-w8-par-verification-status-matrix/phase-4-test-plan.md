# Phase 4: テスト作成（検証スクリプト設計）

## 目的

docs-only タスクのため、コード TDD 相当の作業を「matrix 完整性チェック」に置き換える。RED → GREEN の代わりに「事前に失敗条件を列挙し、Phase 5 出力で全条件を解消」する形を取る。

---

## 1. 検証項目（事前 RED 条件）

| ID | チェック | 期待 |
|----|----------|------|
| T-01 | `VERIFICATION-STATUS.md` がリポジトリに存在する | exist |
| T-02 | matrix table の行数（header / separator を除く）が 22 | 22 |
| T-03 | matrix table のデータ列数（C1〜C4）が 4 | 4 |
| T-04 | 88 セル中 PASS/WARN/FAIL/N/A 以外の値が 0 件 | 0 |
| T-05 | 空セル（`||` 連続）が 0 件 | 0 |
| T-06 | WARN / FAIL のセルに対応する「備考」行に理由文字列が存在 | all-present |
| T-07 | GFM table separator 行が `\|---\|`（または `\|:---:\|`）で揃っている | valid |
| T-08 | 凡例セクション・評価日付セクションが matrix の前に存在 | exist |
| T-09 | サマリー（PASS/WARN/FAIL/N/A 件数 + 合計 88）が末尾に存在 | exist |
| T-10 | 22 行の Task ID が `task-01` 〜 `task-22` を全網羅 | 22-unique |

---

## 2. 検証手順（概念コマンド）

```bash
# T-01
test -f docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/VERIFICATION-STATUS.md

# T-02 / T-03: matrix 行・列数の確認
awk '/^\| task-[0-9]+/ { rows++ } END { print rows }' \
  docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/VERIFICATION-STATUS.md
# => 22

# T-04 / T-05: セル値の検査
grep -oE 'PASS|WARN|FAIL|N/A' \
  docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/VERIFICATION-STATUS.md \
  | wc -l
# => >= 88（行 ID とサマリーを除いた matrix 部）

# T-10: Task ID の全網羅
for i in $(seq -w 1 22); do
  grep -qE "^\| task-$i " docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/VERIFICATION-STATUS.md \
    || echo "MISSING: task-$i"
done
```

---

## 3. テスト分類（NON_VISUAL）

- 自動テストなし（docs-only）
- 概念チェックを `outputs/phase-6/test-additions.md` に列挙し、人間レビュー + Phase 9 で再確認

---

## 4. 成果物

- `outputs/phase-4/test-plan.md`

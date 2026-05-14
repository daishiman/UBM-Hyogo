# Phase 6: テスト拡充

## 目的

Phase 4 で列挙した RED 条件を解消したことを確認し、補助 fail-path チェックを追加する。

---

## 1. 追加チェック項目

| ID | チェック | 期待 |
|----|----------|------|
| T-11 | 22 行の Task 列がソート順（task-01〜task-22）で並んでいる | sorted |
| T-12 | 各データ行のパイプ `\|` 数が header 行のパイプ数と一致 | equal |
| T-13 | 「主題」列が各 task spec の `Task ID` または「目的」と整合 | aligned |
| T-14 | 「備考」列が PASS-only 行で空でも、separator は正しく維持されている | valid |
| T-15 | サマリーの 4 値合計が必ず 88 | sum == 88 |
| T-16 | 評価日付が ISO 8601（YYYY-MM-DD）形式 | valid |
| T-17 | 参照 commit が短縮 SHA（>= 7 文字）または full SHA | valid |

---

## 2. fail-path 回帰 guard

- 将来 22 タスクに 23 番目（task-23 以降）が追加された場合、本 matrix は対象外（task-23 自身を含まない）→ docstring に明記
- task spec が削除された場合は matrix の該当行を「DELETED」マーカーで残す方針（運用ガイドライン）

---

## 3. 成果物

- `outputs/phase-6/test-additions.md`

# Phase 9: 品質保証

> Phase: 9 / 13
> 名称: 品質保証

---

## QA チェック項目

| 観点 | 基準 | 確認方法 |
|------|------|---------|
| line budget | `MVP-3LAYER-TASK-MAPPING.md` ≤ 600 行 | `wc -l` |
| GFM 構文 | table / 見出し / リンクが妥当 | markdown linter |
| 参照リンク健全性 | 参照する `SCOPE.md` / `VERIFICATION-STATUS.md` / 各 task root の path が実在 | `ls` で確認 |
| 表記揺れ 0 件 | 「必須/強関与/軽関与/無関係」以外の分類語が出現しない | grep |
| 88 セル充足 | TC-03 PASS 維持 | Phase 4 TC 再実行 |
| 双方向一致 | TC-04 / TC-11 PASS 維持 | 同上 |
| 既存ファイル未変更 | task-01〜22 spec / 実装に diff なし | `git diff --name-only` |
| 19 routes 網羅 | TC-10 / TC-15 PASS | grep + 目視 |

---

## 削除確認（FB-UI-02-1）

本タスクは新規 docs 生成のみで削除なし。削除確認は N/A。

---

## 完了条件

全項目 PASS。1 件でも FAIL なら該当 Phase（5/6/8 のいずれか）に戻って修正。

# Phase 10: 最終レビュー

## 受入条件再確認

| AC | 判定 |
|----|------|
| INVARIANT-AUDIT.md 存在 | Phase 5 で生成 |
| 22×6 matrix 完備 | Phase 9 でセル数チェック |
| VIOLATION に file:line 引用 | Phase 6 の guard で検証 |
| grep evidence 保存 | Phase 5 で `grep-evidence.txt` 保存 |
| read-only 担保 | Phase 9 で `git diff` 確認 |

## blocker 判定

- BLOCKER 0 件 → Phase 11 へ
- MINOR 指摘は `outputs/phase-12/unassigned-task-detection.md` に格下げ登録

## 残課題

- task-27 がこの監査結果を消費するため、INVARIANT-AUDIT.md の場所と命名を変更しないこと

# Phase 10: 最終レビュー

**実装区分**: 実装仕様書（read-only audit; 成果物は audit-runner.sh + INVARIANT-AUDIT.md + evidence。`apps/` / `packages/` 変更ゼロを DoD で担保）。

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

## メタ情報
- Phase: 10 / 最終レビューゲート
- State: completed

## 目的
task-24 の local evidence と下流 task-27 の入力整合を最終確認する。

## 実行タスク
- `INVARIANT-AUDIT.md` の存在を確認する。
- downstream path を確認する。

## 参照資料
- `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/INVARIANT-AUDIT.md`
- `docs/30-workflows/task-27-ui-mvp-w9-solo-mvp-3-layer-task-mapping/phase-2-design.md`

## 成果物
- `phase-10.md`

## 完了条件
- [x] final report が存在する
- [x] task-27 が canonical path を参照する

## 統合テスト連携
Phase 12 compliance check と task-27 design input を照合する。

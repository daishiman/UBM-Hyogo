# Phase 7: カバレッジ（監査網羅率）

**実装区分**: 実装仕様書（read-only audit; 成果物は audit-runner.sh + INVARIANT-AUDIT.md + evidence。`apps/` / `packages/` 変更ゼロを DoD で担保）。

## 監査網羅率

| 観点 | 母集団 | カバー | カバレッジ |
|------|--------|--------|-----------|
| Task | 22 | 22 | 100% |
| Invariant | 6 | 6 | 100% |
| Cell | 132 | 132 | 100% |

## 対象範囲

- 変更行のカバレッジ: 該当なし（read-only audit）
- 監査セル網羅: 22 × 6 = 132 セルすべてに判定を付与

## 範囲外

- 22 タスクの spec / 実装本体への修正
- 不変条件 6 項目以外の品質観点

## メタ情報
- Phase: 7 / テストカバレッジ確認
- State: completed

## 目的
監査網羅率が 22 task x 6 invariant を満たすことを確認する。

## 実行タスク
- matrix の task 数を確認する。
- invariant 列数を確認する。

## 参照資料
- `outputs/phase-5/matrix.tsv`
- `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/INVARIANT-AUDIT.md`

## 成果物
- `phase-7.md`

## 完了条件
- [x] task-01..22 が matrix に存在する
- [x] INV-1..6 が matrix に存在する

## 統合テスト連携
Phase 12 compliance check が matrix coverage を close-out evidence として参照する。

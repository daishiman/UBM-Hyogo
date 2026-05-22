# Phase 3: 設計レビュー

**実装区分**: 実装仕様書（read-only audit; 成果物は audit-runner.sh + INVARIANT-AUDIT.md + evidence。`apps/` / `packages/` 変更ゼロを DoD で担保）。

## レビュー観点

| 観点 | 判定 | コメント |
|------|------|---------|
| 価値性 | PASS | 22 task × 6 invariant の matrix により遵守状態を一覧化、task-27 のリスク評価に直接利用可能 |
| 実現性 | PASS | shell builtins のみで実装可能、外部依存ゼロ |
| 整合性 | PASS | read-only / NON_VISUAL の責務に閉じている。INV と検査ロジックが 1:1 対応 |
| 運用性 | PASS | grep evidence をテキストファイルに保存し再現可能 |

## ゲート判定

- Phase 4 へ進む: **承認**
- 条件: なし

## 因果ループ

- 強化ループ: 監査 evidence → リスク可視化 → task-27 計画精度向上 → 後続 MVP 品質向上
- バランスループ: 監査範囲拡大 → コスト増 → スコープを 6 invariant に固定して抑制

## 状態所有権

- task spec 正本: `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/`
- 監査結果正本: `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/INVARIANT-AUDIT.md`
- 監査 evidence: `docs/30-workflows/completed-tasks/task-24-ui-mvp-w8-par-invariant-audit/outputs/phase-5/`

## メタ情報
- Phase: 3 / 設計レビューゲート
- State: completed

## 目的
監査設計が read-only 境界と下流 task-27 の入力に適合するか確認する。

## 実行タスク
- final deliverable path を確認する。
- parent canonical path を確認する。

## 参照資料
- `phase-2.md`
- `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/`

## 成果物
- `phase-3.md`

## 完了条件
- [x] final deliverable path が固定されている
- [x] evidence path が固定されている

## 統合テスト連携
Phase 5 で設計どおりの evidence path を生成する。

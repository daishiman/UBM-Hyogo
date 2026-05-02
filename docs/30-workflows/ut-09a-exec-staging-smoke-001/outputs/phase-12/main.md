# Phase 12: ドキュメント更新 — ut-09a-exec-staging-smoke-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-09a-exec-staging-smoke-001 |
| phase | 12 / 13 |
| wave | Wave 9 |
| mode | parallel |
| 作成日 | 2026-05-02 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 11 で得た実測結果をシステム仕様書・skill index・後続タスク blocker に反映し、
task-specification-creator skill が要求する Phase 12 必須 7 成果物を作成する。

## 実行タスク

1. Phase 12 strict 7 files を `outputs/phase-12/` に作成する。
2. root / outputs `artifacts.json` parity を確認する。
3. aiworkflow-requirements の discoverability を更新または no-op 理由を記録する。
4. unassigned-task-detection と skill-feedback-report を 0 件でも作成する。
5. compliance check で runtime evidence pending と spec completeness PASS を分離する。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-12-documentation-guide.md
- .claude/skills/task-specification-creator/references/phase12-skill-feedback-promotion.md
- .claude/skills/aiworkflow-requirements/indexes/quick-reference.md
- .claude/skills/aiworkflow-requirements/indexes/resource-map.md

## 必須 5 タスク + Task 6 compliance

1. 実装ガイド作成（Part 1 中学生レベル + Part 2 技術者レベル）
2. システム仕様書更新（aiworkflow-requirements / `task-workflow-active.md` 等）
3. ドキュメント更新履歴作成
4. 未タスク検出レポート作成（**0 件でも出力必須**）
5. スキルフィードバックレポート作成（**改善点なしでも出力必須**）
6. compliance check（最低 7 成果物の実体確認）

## 必須成果物 7 ファイル

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 実装ガイドの構成（Part 1 中学生レベル）

- 「ステージング環境とはなにか」を学校の練習試合に例える
- 「smoke test」を朝の体調チェックに例える
- 専門用語セルフチェック表（5 用語以上）
- なぜを先行して説明し、どうを後に説明する

## 実装ガイドの構成（Part 2 技術者レベル）

- 09a evidence contract の要約
- 実 staging 実行ランブック（Phase 5 / Phase 11 への参照）
- AC ↔ evidence path 対応表
- 09c GO/NO-GO 判定式

## システム仕様書更新先

- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`（09c blocker / 09a evidence 状態）
- `.claude/skills/aiworkflow-requirements/indexes/`（必要時）

## skill feedback 観点

- placeholder PASS 化を防ぐルールが skill 側に必要か
- VISUAL_ON_EXECUTION × spec_created の運用パターンを skill 側に追加すべきか
- 09a runbook → 09c production の transition で再利用可能なテンプレが作れるか

## docs-only / spec_created の境界

- 本タスクは `taskType=implementation` だが Phase 11 を user 明示指示で実行する gate 設計
- `workflow_state` は実 staging 実行 PASS まで `spec_created` のまま据え置く
- Phase 12 close-out で `workflow_state` を勝手に `completed` に書き換えない

## サブタスク管理

- [ ] 7 成果物を全て作成
- [ ] Part 1 / Part 2 の二段構成で implementation-guide を書く
- [ ] system-spec-update-summary に変更先と影響範囲を明記
- [ ] unassigned-task-detection を 0 件でも出力
- [ ] skill-feedback-report を改善なしでも出力
- [ ] compliance-check で 7 成果物の実体を確認

## 成果物

- 上記「必須成果物 7 ファイル」一式

## 完了条件

- 7 成果物が全て実体として存在
- artifacts parity が PASS
- 09c blocker 更新差分が system spec に反映済み
- workflow_state が境界ルールに従って更新（または据え置き）されている

## タスク100%実行確認

- [ ] 7 成果物が揃っている
- [ ] Part 1 が中学生レベルになっている
- [ ] unassigned-task / skill-feedback が 0 件でも出力されている

## 次 Phase への引き渡し

Phase 13 へ、commit / push / PR 作成のための前提整理を渡す。実行は user 明示指示後。

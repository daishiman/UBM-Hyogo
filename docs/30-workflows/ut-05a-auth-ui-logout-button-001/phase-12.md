[実装区分: 実装仕様書]

# Phase 12: ドキュメント更新 — ut-05a-auth-ui-logout-button-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-05a-auth-ui-logout-button-001 |
| phase | 12 / 13 |
| wave | Wave 5 follow-up |
| mode | parallel |
| 作成日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 11 の実測結果をシステム仕様書・skill index・上流 workflow（05a-followup）に
反映し、task-specification-creator skill が要求する Phase 12 必須 7 成果物を作成する。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-12-spec.md
- .claude/skills/aiworkflow-requirements/references/task-workflow-active.md
- .claude/skills/aiworkflow-requirements/indexes/quick-reference.md
- .claude/skills/aiworkflow-requirements/indexes/resource-map.md

## 実行タスク

1. Phase 12 strict 7 files を `outputs/phase-12/` に作成する
2. root / outputs `artifacts.json` parity を確認する
3. aiworkflow-requirements の discoverability を更新または no-op 理由を記録する
4. unassigned-task-detection と skill-feedback-report を 0 件でも作成する
5. compliance check で runtime evidence 状態と spec completeness を分離する

## 必須成果物 7 ファイル

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 実装ガイドの構成（Part 1 中学生レベル）

- 「ログアウト」を学校のロッカーを閉じて鍵を返す動作に例える
- 「session cookie」をロッカーの鍵に例え、「削除」を鍵を返す動作に例える
- 「Auth.js」を学校の警備員に例える
- 専門用語セルフチェック表（5 用語以上: signOut / redirectTo / session cookie / middleware / redirect）
- なぜ → どう、の順で説明

## 実装ガイドの構成（Part 2 技術者レベル）

- `next-auth/react` `signOut({ redirectTo })` の挙動要約
- client / server 境界の置き方（`"use client"` の必要箇所）
- AC ↔ evidence path 対応表
- M-08 evidence と 05a-followup workflow の連携方針

## システム仕様書更新先

- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
  （ut-05a-followup-google-oauth-completion M-08 の状態と本タスクへのリンク）
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`

## skill feedback 観点

- VISUAL_ON_EXECUTION × spec_created の運用パターンを skill 側に追加するか
- M-08 のような cross-workflow evidence link をテンプレ化できるか
- UI 追加 implementation タスクの単一責務分割パターンとして再利用できるか

## docs-only / spec_created の境界

- 本タスクは `taskType=implementation` だが、Phase 11 を user 明示指示で実行する gate 設計
- `workflow_state` は実 smoke 実行 PASS まで `spec_created` のまま据え置く
- Phase 12 close-out で勝手に `completed` に書き換えない

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
- artifacts parity PASS
- 05a-followup M-08 状態の更新差分が system spec に反映済み（または no-op 理由が記録済）
- workflow_state が境界ルールに従って更新（または据え置き）されている

## タスク100%実行確認

- [ ] 7 成果物が揃っている
- [ ] Part 1 が中学生レベル
- [ ] unassigned-task / skill-feedback が 0 件でも出力されている

## 次 Phase への引き渡し

Phase 13 へ、commit / push / PR 作成のための前提整理を渡す。実行は user 明示指示後。

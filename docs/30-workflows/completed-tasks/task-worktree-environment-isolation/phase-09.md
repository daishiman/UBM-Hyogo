# Phase 09: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-worktree-environment-isolation |
| Phase | 9 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

worktree / tmux / shell state を分離し、他プロジェクト・他セッションとの混線を防ぐ。

## 実行タスク

- line budget、リンク、artifacts parity、Phase 11 NON_VISUAL evidence、Phase 12 必須成果物を一括確認する。
- `.claude/skills/aiworkflow-requirements` の index 更新が references の正本構造と矛盾しないか確認する。
- 計画系表現が Phase 12 outputs に残らないよう確認する。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `CLAUDE.md`
- `scripts/new-worktree.sh`

## 成果物

- `outputs/phase-9/main.md`
- `outputs/phase-9/quality-gate.md`

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは後続実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。

## 完了条件

- [ ] 品質保証 の成果物が artifacts.json と一致する。
- [ ] link / artifact / 計画系表現 / skill index の品質ゲートが記録されている。
- [ ] docs-only / spec_created / NON_VISUAL の分類が崩れていない。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。

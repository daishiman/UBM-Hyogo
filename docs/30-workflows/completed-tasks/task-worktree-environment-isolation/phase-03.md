# Phase 03: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-worktree-environment-isolation |
| Phase | 3 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

worktree / tmux / shell state を分離し、他プロジェクト・他セッションとの混線を防ぐ。

## 実行タスク

- 4条件（価値性、実現性、整合性、運用性）で Phase 2 設計をレビューする。
- 強化ループ（環境分離が混線検知を増やし、修正を促進する）とバランスループ（lock即時失敗が作業速度と安全性を調整する）を記録する。
- 横断依存 `task-git-hooks-lefthook-and-post-merge`、`task-github-governance-branch-protection`、`task-claude-code-permissions-decisive-mode` との境界を確認する。
- MINOR 指摘は Phase 12 の `documentation-changelog.md` または `unassigned-task-detection.md` へ追跡可能にする。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `CLAUDE.md`
- `scripts/new-worktree.sh`

## 成果物

- `outputs/phase-3/main.md`
- `outputs/phase-3/review.md`

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは後続実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。

## 完了条件

- [ ] 設計レビュー の成果物が artifacts.json と一致する。
- [ ] 4条件のレビュー結果が PASS / MINOR / BLOCKER で記録されている。
- [ ] 依存タスクとの境界と申し送り先が明確である。
- [ ] docs-only / spec_created / NON_VISUAL の分類が崩れていない。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。

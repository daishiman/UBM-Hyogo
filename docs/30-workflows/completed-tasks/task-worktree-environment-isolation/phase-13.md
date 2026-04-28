# Phase 13: 完了確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-worktree-environment-isolation |
| Phase | 13 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

worktree / tmux / shell state を分離し、他プロジェクト・他セッションとの混線を防ぐ。

## 実行タスク

- Phase 12 までの成果物と検証結果を `change-summary.md` に要約する。
- `main.md` に user approval の有無、blocked 理由、local check 結果、PR作成可能条件を記録する。
- `pr-template.md` は作成準備だけ行い、ユーザーの明示承認があるまで commit / push / PR 作成を行わない。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `CLAUDE.md`
- `scripts/new-worktree.sh`

## 成果物

- `outputs/phase-13/main.md`
- `outputs/phase-13/change-summary.md`
- `outputs/phase-13/pr-template.md`

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは後続実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。

## 完了条件

- [ ] 完了確認 の成果物が artifacts.json と一致する。
- [ ] Phase 13 が user approval required / blocked として記録されている。
- [ ] commit / push / PR 未実行が確認されている。
- [ ] docs-only / spec_created / NON_VISUAL の分類が崩れていない。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。

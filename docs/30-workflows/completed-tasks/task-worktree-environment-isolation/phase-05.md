# Phase 05: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-worktree-environment-isolation |
| Phase | 5 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

worktree / tmux / shell state を分離し、他プロジェクト・他セッションとの混線を防ぐ。

## 実行タスク

- 後続実装で作成・修正する候補ファイルを「新規作成」「修正」に分けて列挙する。
- `.claude/skills` の symlink 撤去手順、tmux session 起動手順、`.worktrees/.locks` lock 手順、shell入場手順をランブック化する。
- `flock` と `mkdir` lock の採用条件、stale lock 判定、即時失敗方針を明記する。
- 実装コードは本タスクでは作らず、ランブックを後続実装タスクの入力として固定する。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `CLAUDE.md`
- `scripts/new-worktree.sh`

## 成果物

- `outputs/phase-5/main.md`
- `outputs/phase-5/runbook.md`

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは後続実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。

## 完了条件

- [ ] 実装ランブック の成果物が artifacts.json と一致する。
- [ ] 新規作成 / 修正候補ファイル一覧が記録されている。
- [ ] 実装しない範囲と後続実装への入力が分離されている。
- [ ] docs-only / spec_created / NON_VISUAL の分類が崩れていない。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。

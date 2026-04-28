# Phase 01: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-worktree-environment-isolation |
| Phase | 1 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

worktree / tmux / shell state を分離し、他プロジェクト・他セッションとの混線を防ぐ。

## 実行タスク

- taskType を `docs-only`、workflow を `spec_created`、visualEvidence を `NON_VISUAL` として固定する。
- `git log --oneline -5` と現行差分を棚卸しし、上位タスク `task-conflict-prevention-skill-state-redesign` からの carry-over と本タスク固有の新規範囲を分離する。
- `CLAUDE.md` と `scripts/new-worktree.sh` の現状を読み、skill symlink、tmux env、gwt-auto lock、shell state の4領域を受入条件へ分解する。
- Phase 11 では screenshot を作らず、`main.md`、`manual-smoke-log.md`、`link-checklist.md` の3点だけで NON_VISUAL 証跡を残す前提を明記する。
- Phase 13 はユーザー承認待ちを維持し、commit / push / PR 作成を禁止する。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `CLAUDE.md`
- `scripts/new-worktree.sh`

## 成果物

- `outputs/phase-1/main.md`

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、実装コードの統合テストは後続実装タスクで実行する。Phase 1 では targeted run 候補として `find .claude/skills -type l`、`tmux show-environment`、`scripts/new-worktree.sh` 二重起動の期待動作を列挙し、Phase 11 代替証跡へ接続する。

## 完了条件

- [ ] 要件定義の成果物が artifacts.json と一致する。
- [ ] carry-over と新規作業の差異が記録されている。
- [ ] 4領域の受入条件が検証可能な形で定義されている。
- [ ] docs-only / spec_created / NON_VISUAL の分類が崩れていない。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。

# Phase 02: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-worktree-environment-isolation |
| Phase | 2 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

worktree / tmux / shell state を分離し、他プロジェクト・他セッションとの混線を防ぐ。

## 実行タスク

- Phase 1 の受入条件を、skill symlink、tmux session state、gwt-auto lock、shell initialization、NON_VISUAL evidence の5設計単位へ割り当てる。
- 既存コンポーネント再利用可否として、`CLAUDE.md` と `scripts/new-worktree.sh` の既存手順を優先し、新規ツール導入は後続実装タスクの判断に分離する。
- 状態所有権を明記する: skill配置は `.claude/skills`、tmux環境は session、lockは `.worktrees/.locks`、shell stateは入場スクリプト、証跡は `outputs/phase-11` が保持する。
- validation path を Phase 11 の3成果物へ接続し、screenshot 不要の根拠を設計で固定する。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `CLAUDE.md`
- `scripts/new-worktree.sh`

## 成果物

- `outputs/phase-2/main.md`
- `outputs/phase-2/design.md`

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは後続実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。

## 完了条件

- [ ] 設計 の成果物が artifacts.json と一致する。
- [ ] 受入条件と設計決定が1対1以上で対応している。
- [ ] 状態所有権と責務境界が混在していない。
- [ ] docs-only / spec_created / NON_VISUAL の分類が崩れていない。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。

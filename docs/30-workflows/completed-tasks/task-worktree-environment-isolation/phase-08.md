# Phase 08: リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-worktree-environment-isolation |
| Phase | 8 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

worktree / tmux / shell state を分離し、他プロジェクト・他セッションとの混線を防ぐ。

## 実行タスク

- Phase 1〜7 の重複表現を整理し、用語を worktree、tmux session state、gwt-auto lock、shell state、NON_VISUAL evidence に統一する。
- 変更内容を `対象 / Before / After / 理由` テーブルで記録する。
- artifacts.json、index.md、phase本文、outputs の成果物名が一致するか確認する。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `CLAUDE.md`
- `scripts/new-worktree.sh`

## 成果物

- `outputs/phase-8/main.md`
- `outputs/phase-8/before-after.md`

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは後続実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。

## 完了条件

- [ ] リファクタリング の成果物が artifacts.json と一致する。
- [ ] `対象 / Before / After / 理由` テーブルがある。
- [ ] 用語と成果物名のドリフトがない。
- [ ] docs-only / spec_created / NON_VISUAL の分類が崩れていない。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。

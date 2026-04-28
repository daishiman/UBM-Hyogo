# Phase 07: カバレッジ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-worktree-environment-isolation |
| Phase | 7 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

worktree / tmux / shell state を分離し、他プロジェクト・他セッションとの混線を防ぐ。

## 実行タスク

- 受入条件 AC-1〜AC-4、設計決定 D-1〜D-5、証跡 EV-1〜EV-7 の対応表を作る。
- skill symlink、tmux、lock、shell、docs evidence の5領域が漏れなくカバーされているか確認する。
- カバーできない runtime 挙動は Phase 12 の未タスク検出へ申し送る。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `CLAUDE.md`
- `scripts/new-worktree.sh`

## 成果物

- `outputs/phase-7/main.md`
- `outputs/phase-7/coverage.md`

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは後続実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。

## 完了条件

- [ ] カバレッジ確認 の成果物が artifacts.json と一致する。
- [ ] AC / D / EV の対応表に空欄がない。
- [ ] 未カバー項目が未タスク候補へ接続されている。
- [ ] docs-only / spec_created / NON_VISUAL の分類が崩れていない。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。

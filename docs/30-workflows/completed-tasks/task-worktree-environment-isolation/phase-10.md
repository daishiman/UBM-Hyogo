# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-worktree-environment-isolation |
| Phase | 10 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

worktree / tmux / shell state を分離し、他プロジェクト・他セッションとの混線を防ぐ。

## 実行タスク

- Phase 1〜9 の受入条件、設計決定、証跡、未タスク候補を最終レビューする。
- BLOCKER があれば Phase 12 へ進めず、MINOR は Phase 12 の追跡テーブルまたは未タスク化へ回す。
- Go / No-Go 判定には docs-only / spec_created / NON_VISUAL の境界維持を含める。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `CLAUDE.md`
- `scripts/new-worktree.sh`

## 成果物

- `outputs/phase-10/main.md`
- `outputs/phase-10/go-no-go.md`

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは後続実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。

## 完了条件

- [ ] 最終レビュー の成果物が artifacts.json と一致する。
- [ ] BLOCKER 0件、MINOR の処理先が明確である。
- [ ] docs-only / spec_created / NON_VISUAL の分類が崩れていない。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。

# Phase 11: 手動テスト

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-worktree-environment-isolation |
| Phase | 11 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

worktree / tmux / shell state を分離し、他プロジェクト・他セッションとの混線を防ぐ。

## 実行タスク

- docs-only / NON_VISUAL として screenshot を作成しない理由を `main.md` に記録する。
- `manual-smoke-log.md` に EV-1〜EV-7 のコマンド、期待結果、保証範囲、保証できない範囲を記録する。
- `link-checklist.md` で index、phase-01〜13、outputs、aiworkflow index 変更のリンクを確認する。
- 保証できない runtime 項目を Phase 12 の `unassigned-task-detection.md` へ申し送る。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `CLAUDE.md`
- `scripts/new-worktree.sh`

## 成果物

- `outputs/phase-11/main.md`
- `outputs/phase-11/manual-smoke-log.md`
- `outputs/phase-11/link-checklist.md`

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは後続実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。

## 完了条件

- [ ] 手動テスト の成果物が artifacts.json と一致する。
- [ ] screenshot 不要の理由と3点代替証跡が記録されている。
- [ ] 保証できない項目が Phase 12 へ接続されている。
- [ ] docs-only / spec_created / NON_VISUAL の分類が崩れていない。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。

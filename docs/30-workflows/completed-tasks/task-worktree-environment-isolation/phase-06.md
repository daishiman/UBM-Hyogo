# Phase 06: テスト拡充

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-worktree-environment-isolation |
| Phase | 6 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

worktree / tmux / shell state を分離し、他プロジェクト・他セッションとの混線を防ぐ。

## 実行タスク

- Phase 4 のテストマトリクスに fail path を追加する。
- symlink が残る、tmux global env が残る、lock が解放されない、親シェルの secret env が継承される、の4失敗系を必須にする。
- Phase 11 の `manual-smoke-log.md` に貼る期待出力と、保証できない範囲を対応付ける。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `CLAUDE.md`
- `scripts/new-worktree.sh`

## 成果物

- `outputs/phase-6/main.md`
- `outputs/phase-6/failure-cases.md`

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは後続実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。

## 完了条件

- [ ] テスト拡充 の成果物が artifacts.json と一致する。
- [ ] fail path と保証できない範囲が Phase 11 / Phase 12 へ接続されている。
- [ ] docs-only / spec_created / NON_VISUAL の分類が崩れていない。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。

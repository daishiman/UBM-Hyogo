# Phase 04: テスト設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-worktree-environment-isolation |
| Phase | 4 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

worktree / tmux / shell state を分離し、他プロジェクト・他セッションとの混線を防ぐ。

## 実行タスク

- Phase 11 で実行する NON_VISUAL smoke のテストマトリクスを定義する。
- `find .claude/skills -type l`、`tmux show-environment`、lock二重取得、shell入場時の `mise` / `direnv` 状態確認を対象にする。
- macOS で `flock(1)` が使えない場合の `mkdir` lock 代替を失敗系テストへ含める。
- private method や実装内部のテストは本 docs-only タスクでは作らず、後続実装タスクの public script / callback 経由検証へ申し送る。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `CLAUDE.md`
- `scripts/new-worktree.sh`

## 成果物

- `outputs/phase-4/main.md`
- `outputs/phase-4/test-matrix.md`

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、ここではテストコードではなくコマンド仕様を作る。後続実装タスクの開始前ゲートとして `pnpm install` と該当パッケージ build の必要有無を確認する項目を残す。

## 完了条件

- [ ] テスト設計 の成果物が artifacts.json と一致する。
- [ ] 正常系、異常系、macOS代替系がテストマトリクスに含まれている。
- [ ] docs-only / spec_created / NON_VISUAL の分類が崩れていない。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。

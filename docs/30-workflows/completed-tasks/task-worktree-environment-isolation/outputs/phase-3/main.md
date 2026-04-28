# Phase 3: 設計レビュー（サマリ） — task-worktree-environment-isolation

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3（設計レビュー） |
| 種別 | docs-only / NON_VISUAL / spec_created |
| 入力 | `outputs/phase-2/main.md`, `outputs/phase-2/design.md` |
| 出力 | `outputs/phase-3/main.md`（本ファイル）, `outputs/phase-3/review.md` |

## レビューサマリ

Phase 2 で確定した設計を、以下 4 観点でレビューした。詳細は [`review.md`](./review.md)。

1. 受け入れ条件 AC-1〜AC-4 と設計セクション §1〜§6 の対応
2. `.claude/skills/aiworkflow-requirements/` 仕様（resource-map / quick-reference）との整合
3. `CLAUDE.md` 重要不変条件 1〜7 との衝突有無
4. 横断依存タスク（depends_on / blocks）との責務境界

## Go / No-Go 暫定判断

**Go（条件付き）**。受け入れ条件 4 項目すべてが設計でカバーされ、不変条件・上位タスクとの矛盾は検出されなかった。条件は以下 2 点。

- 条件 1: macOS 互換性（`flock(1)` 不在）の最終選択を Phase 5 ランブックで確定する。
- 条件 2: skill symlink 検出の責務を `task-git-hooks-lefthook-and-post-merge` に正式に申し送る（hooks 側で受け入れる前提を確認）。

## 検出した懸念点

- `.worktrees/.locks/` ディレクトリの `.gitignore` 状態を Phase 5 で明示確認すること。
- tmux 設計は opt-in だが、UBM 開発者の標準環境で既に tmux global env が汚染されている可能性があり、Phase 11 の手動テストで baseline 取得が必要。

## 次 Phase への申し送り

- Phase 4 テスト設計: §3.5（flock / mkdir 二系統）と日本語パスを分岐ケースに含める。
- Phase 5 実装ランブック: macOS の lock 実装最終選択 + `.gitignore` 確認を盛り込む。
- Phase 11 手動テスト: EV-1〜EV-7 を順序通りに実行し、tmux baseline（汚染状況）も取得する。

# Phase 2: 設計（サマリ） — task-worktree-environment-isolation

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2（設計） |
| 種別 | docs-only / NON_VISUAL / spec_created |
| 入力 | `outputs/phase-1/main.md` |
| 出力 | `outputs/phase-2/main.md`（本ファイル）, `outputs/phase-2/design.md` |

## 進行サマリ

Phase 1 で確定した受け入れ条件 AC-1〜AC-4 に基づき、設計書 `design.md` を作成した。設計は以下 4 軸で構成する。

1. **skill symlink 撤去方針**（AC-1）— `.claude/skills/` の現状インベントリ取得 → 撤去 → per-worktree 実体配置への移行手順。
2. **tmux session-scoped state**（AC-2）— `update-environment` リスト最小化 + per-session env 命名規約 + new-session ラッパー。
3. **gwt-auto lock**（AC-3）— ブランチ名ベースの mkdir lockdir 排他制御、stale 判定、即時失敗方針。
4. **shell state 分離**（横断要件）— ワークツリー入場時の `mise` / `direnv` リセット + プロンプト識別子。

詳細は [`design.md`](./design.md) を参照。

## 主要決定事項

| 決定 | 内容 |
| --- | --- |
| D-1 | `.claude/skills/` 配下の symlink は **全撤去**。代替は「グローバル所在を `claude` 起動側で参照」または「per-worktree 実コピー」の二択を docs で明示し、デフォルトは前者 |
| D-2 | tmux は `set-option -g update-environment` から worktree 依存変数（`PWD`, `CLAUDE_PROJECT_DIR`, `MISE_*`）を除外。new-session 時に明示注入 |
| D-3 | gwt-auto lock は `${REPO_ROOT}/.worktrees/.locks/<branch-slug>-<sha8>.lockdir` を mkdir 原子性で取得。タイムアウト 0 秒（即時失敗） |
| D-4 | shell 入場時に `mise trust && mise install` を必須化、`direnv allow` を任意。プロンプトに worktree 名を表示する hook を docs サンプル提示 |
| D-5 | NON_VISUAL evidence は `find` / `tmux show-environment` / lockdir owner / 二重起動 exit code の標準出力を `outputs/phase-11/manual-smoke-log.md` に貼る方針 |

## Go / No-Go 暫定判断

設計レベルでは 4 軸とも CLAUDE.md 不変条件と整合し、上位タスクの決定事項とも矛盾しない。Phase 3 のレビューで最終判断する。

## 次 Phase への申し送り

- Phase 3 レビューでは AC-1〜AC-4 と D-1〜D-5 を 1:1 でマッピング検証する。
- 横断依存タスク（`task-git-hooks-lefthook-and-post-merge`, `task-github-governance-branch-protection` 等）と worktree lock の責務境界を確認する。

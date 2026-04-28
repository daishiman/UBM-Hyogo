# Phase 8: Before / After — リファクタリング差分

本ドキュメントは docs-only タスクのリファクタリング差分を可視化する。実装は後続タスクで行うため、ここでは**変更前後のディレクトリ構造・フロー・設定を固定**し、後続タスクが規範として参照できる状態にする。

---

## R-1. skill symlink 撤去（AC-1 / D-1）

### Before（現状）

```
リポジトリルート/
├── .claude/
│   └── skills/
│       ├── aiworkflow-requirements/        # 実ディレクトリ（OK）
│       ├── task-specification-creator/     # 実ディレクトリ（OK）
│       └── <local-only-skill> -> /Users/<user>/.claude/skills/<name>/   # ← symlink（NG）
└── .worktrees/
    └── task-XXXX-wt-5/
        └── .claude/skills/
            └── <local-only-skill> -> 同上                                # worktree 跨ぎで共有
```

参照経路: worktree 側のスキル変更 → `~/.claude/skills/` 実体 → 別 worktree にも即時反映（混線）。

### After（撤去後）

```
リポジトリルート/
├── .claude/
│   └── skills/
│       ├── aiworkflow-requirements/        # 実ディレクトリ
│       └── task-specification-creator/     # 実ディレクトリ
└── .worktrees/
    └── task-XXXX-wt-5/
        └── .claude/skills/                  # 実ディレクトリのみ（symlink ゼロ）
```

参照経路:
- **方針 A（推奨）**: worktree 側にエントリを置かず、Claude Code harness がグローバル `~/.claude/skills/` を解決する。
- **方針 B**: 必要な skill は実ファイルでコミットし、`git` でバージョン管理する。

### 影響範囲

| 項目 | 影響 |
| --- | --- |
| 既存の実ディレクトリスキル | 影響なし |
| ローカル開発者の私物 symlink | 撤去対象（事前インベントリ → `git rm` → 代替経路へ移行） |
| Phase 11 evidence | EV-1 `find .claude/skills -type l \| wc -l == 0` が通る |

### 後方互換性メモ

- 撤去前のインベントリ（macOS/BSD find 互換の `find -type l -exec ... readlink ...`）を runbook に保存。
- rollback は `ln -s <target> <link>` で復元可能。
- `lefthook` の pre-commit で再導入を検出する案を `task-git-hooks-lefthook-and-post-merge` に申し送る。

---

## R-2. `scripts/new-worktree.sh` の変更（AC-3 / D-3）

### Before（現状フロー）

```
$ bash scripts/new-worktree.sh feat/foo
  └─ git worktree add -b feat/foo .worktrees/<name> origin/main
  └─ cd .worktrees/<name>
  └─ mise install
  └─ pnpm install
  └─ "✅ ワークツリー作成完了"
```

問題点:
1. 同一ブランチ並列起動で `git worktree add` が競合し、半端な `.worktrees/<name>` が残る。
2. lock 機構なし。
3. tmux / symlink audit なし。

### After（改修後フロー）

```
$ bash scripts/new-worktree.sh feat/foo [--with-tmux] [--audit]
  ├─ [新規] BRANCH_SLUG 生成（tr ベース、ASCII 限定、最大 64 文字）
  ├─ [新規] mkdir -p .worktrees/.locks
  ├─ [新規] flock -n 9 (or mkdir <slug>.lockdir フォールバック) ← 即時失敗 (exit 75)
  ├─ [新規] lock メタ書き込み (pid / host / ts / wt)
  ├─ [新規] trap EXIT で flock -u + rm -f
  ├─ [既存] git worktree add -b feat/foo .worktrees/<name> origin/main
  ├─ [既存] mise install
  ├─ [既存] pnpm install
  ├─ [opt-in] --audit 時のみ symlink インベントリ
  ├─ [opt-in] --with-tmux 時のみ tmux new-session -e ... を実行
  └─ "✅ ワークツリー作成完了"（出力体裁不変）
```

### 影響範囲

| 項目 | 影響 |
| --- | --- |
| 既存呼び出し `bash scripts/new-worktree.sh feat/foo` | 出力・終了コードとも不変（lock 取得成功時） |
| 競合発生時 | 後発が exit 75 で即時失敗（`.worktrees/<name>` 半端状態を作らない） |
| macOS 互換 | `flock(1)` 不在時は `mkdir` フォールバック |

### 後方互換性メモ

- 新規フラグ `--with-tmux` / `--audit` はすべて opt-in。デフォルト挙動は不変。
- lockdir `.worktrees/.locks/*.lockdir/owner` は `.worktrees/` 配下なので既存 `.gitignore` の対象。
- 日本語パス（`個人開発`）に対する耐性: lock ファイル名は branch slug のみで構成し、path は引用符で保護。

---

## R-3. tmux 設定の before/after（AC-2 / D-2）

### Before（典型的な汚染パターン）

```tmux
# 既定の update-environment（暗黙）
# DISPLAY SSH_ASKPASS SSH_AUTH_SOCK SSH_CONNECTION SSH_TTY WINDOWID XAUTHORITY
# + シェルが export した PWD / CLAUDE_PROJECT_DIR / OP_SERVICE_ACCOUNT_TOKEN が
#   tmux global-environment に乗ってしまうケースあり
```

新規ペイン: 親シェルの `PWD` や前 worktree の `CLAUDE_PROJECT_DIR` を継承し、誤った worktree でコマンド実行。

### After

```tmux
# global env はワークツリー依存変数を含めない
set-option -g update-environment "SSH_AUTH_SOCK SSH_CONNECTION DISPLAY"
```

session 起動:

```bash
tmux new-session -d -s "ubm-${SLUG}" -c "$WT_PATH" \
  -e "UBM_WT_PATH=$WT_PATH" \
  -e "UBM_WT_BRANCH=$BRANCH" \
  -e "UBM_WT_SESSION=ubm-${SLUG}"
```

### 影響範囲

| 項目 | 影響 |
| --- | --- |
| tmux 非利用者 | 影響なし（`--with-tmux` opt-in） |
| 既存セッション | 破棄して作り直しを runbook で明示 |
| Phase 11 evidence | EV-2 `tmux show-environment -g \| grep UBM_WT_` が空、EV-3 session-scope に 3 件 |

### 後方互換性メモ

- 既存セッションは `tmux kill-session -t <old>` 後に再作成する手順を runbook に明記。
- `update-environment` の他要素を上書きしないよう、ユーザー設定との merge 方法を docs に併記。

---

## R-4. shell 初期化の before/after（D-4）

### Before

```
$ Cmd+T で新タブ
  └─ 親シェルの PATH / MISE_ENV / direnv state / OP_SERVICE_ACCOUNT_TOKEN を継承
  └─ cd .worktrees/<name>
  └─ node --version → 旧 Node が出る場合あり
  └─ pnpm install → mise shim 未更新で誤バージョン解決
```

### After

```
$ ターミナルタブ作成 → ワークツリーへ入場
  └─ unset OP_SERVICE_ACCOUNT_TOKEN   # 親シェルからの secret 漏れを防ぐ
  └─ cd "$WT_PATH"
  └─ mise trust --quiet
  └─ mise install --quiet
  └─ hash -r                           # PATH キャッシュクリア
  └─ （任意）PROMPT に [wt:<name>] を表示
  └─ claude                            # ここから Claude Code 起動
```

### 影響範囲

| 項目 | 影響 |
| --- | --- |
| `mise exec --` 既存運用 | 不変（CLAUDE.md と整合） |
| `scripts/with-env.sh` / `scripts/cf.sh` | 不変（worktree 内で動作） |
| direnv 利用者 | `direnv allow` を worktree ごとに 1 回必要（runbook 明示） |

### 後方互換性メモ

- shell 初期化スニペットは docs サンプルとしての提示に留め、強制しない。
- `unset OP_*` は `claude` 起動前ステップとしてのみ推奨（既存の `with-env.sh` は op 参照のみで実値を持たないため、二重防御）。

---

## サマリ: リファクタリング全体の境界

| 軸 | 変更先 | 変更ファイル（実装タスク側） | 本タスクでの成果物 |
| --- | --- | --- | --- |
| R-1 skill symlink | リポジトリ全体 | `.claude/skills/` 配下 | docs（撤去方針・rollback） |
| R-2 new-worktree.sh | `scripts/new-worktree.sh` | 同左 | docs（before/after フロー） |
| R-3 tmux | ユーザー `~/.tmux.conf` + ラッパー | `scripts/new-worktree.sh` への opt-in | docs（設定例・session 命名） |
| R-4 shell | 開発者の zshrc/bashrc | （無、推奨手順のみ） | docs（初期化スニペット） |

**全項目に共通して、本タスクではコードを変更しない。** 後続実装タスクが本ドキュメントを規範として実装する。

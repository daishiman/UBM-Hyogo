# task-new-worktree-script-hardening

| 項目 | 内容 |
| --- | --- |
| status | detected |
| detected_in | task-worktree-environment-isolation |
| priority | high |
| owner_candidate | platform / dev-environment |

## Why

`scripts/new-worktree.sh` は worktree 作成の標準入口だが、現状は同名ブランチ並列作成の lock、shell state reset、tmux session-scoped env の opt-in を実装していない。仕様だけが存在して実スクリプトに反映されないと、混線防止の価値が得られない。

## What

- `.worktrees/.locks/<branch-slug>.lockdir` の `mkdir` lock を `git fetch` より前に取得する。
- `cd "$WT_PATH"` 後に `unset OP_SERVICE_ACCOUNT_TOKEN` と `hash -r` を実行する。
- `--with-tmux` で `tmux new-session -e UBM_WT_*` を作成する。
- `--audit` で `.claude/skills` symlink inventory を出力する。

## Acceptance Criteria

- `bash scripts/new-worktree.sh feat/foo` の既存呼び出しは成功時の後方互換を維持する。
- 同名ブランチを並列起動した後発プロセスが exit 75 で停止する。
- lock owner に `pid` / `host` / `ts` / `wt` が記録される。
- `mise exec -- node --version` が project 指定バージョンを返す。

## References

- `docs/30-workflows/task-worktree-environment-isolation/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/task-worktree-environment-isolation/outputs/phase-5/runbook.md`

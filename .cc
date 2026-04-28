#!/usr/bin/env bash
# このワークツリー専用のClaude Code起動スクリプト
# 必ずこのスクリプト経由で起動することでcwdを保証する
cd "/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260427-133024-wt-2"
exec claude --dangerously-skip-permissions "$@"

# Phase 11 Evidence: NON_VISUAL smoke

## 判定

DOC_PASS / NON_VISUAL。

## 実測コマンド

| コマンド | 期待 | 状態 |
| --- | --- | --- |
| `bash -n scripts/new-worktree.sh` | syntax OK | PASS |
| `git rev-list --left-right --count origin/main...origin/dev` | `0 0` remote sync | PASS（同期済み前提を記録） |
| `rg -n "git merge origin/main|git fetch origin main|git diff main\\.\\.\\.HEAD|--base main" .claude/commands/ai/diff-to-pr.md` | operational stale hit 0 | PASS after this wave |
| `rg -n "git merge origin/main|git fetch origin main|git diff main\\.\\.\\.HEAD" CLAUDE.md` | stale sync hit 0 | PASS |

## 境界

- PR 作成、push、commit は Phase 13 user approval gate。
- PR merge 後の `deploy-staging` 実測は本 Phase 11 の PASS 条件に含めない。
- スクリーンショットは不要。

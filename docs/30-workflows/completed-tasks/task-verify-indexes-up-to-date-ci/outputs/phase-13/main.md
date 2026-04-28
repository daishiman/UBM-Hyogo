# Phase 13 — PR 作成（指示書 / 実行禁止）

> **重要**: 本 phase は **指示書のみ**。ユーザーから明示的な承認を得るまで、`git commit` / `git push` / `gh pr create` は実行しない。

## 状態

| 項目 | 値 |
| --- | --- |
| タスク状態 | implementation_completed_pr_pending |
| Phase 13 状態 | pending_user_approval |
| 実装範囲 | CI workflow + 正本仕様 + 運用 docs + task artifacts |
| UI 証跡 | NON_VISUAL のためスクリーンショット不要 |

## 変更対象チェック

PR 前に、少なくとも次の変更が同一スコープとして含まれていることを確認する。

- `.github/workflows/verify-indexes.yml`
- `CLAUDE.md`
- `doc/00-getting-started-manual/lefthook-operations.md`
- `.claude/skills/aiworkflow-requirements/references/technology-devops-core.md`
- `.claude/skills/aiworkflow-requirements/LOGS.md`
- `.claude/skills/aiworkflow-requirements/SKILL-changelog.md`
- `.claude/skills/task-specification-creator/LOGS.md`
- `.claude/skills/aiworkflow-requirements/indexes/`
- `docs/30-workflows/completed-tasks/task-verify-indexes-up-to-date-ci/`
- lefthook runbook 関連変更を同梱する場合は `scripts/reinstall-lefthook-all-worktrees.sh` と `docs/30-workflows/completed-tasks/task-lefthook-multi-worktree-reinstall-runbook.md`

## PR タイトル案

```text
ci(verify-indexes): aiworkflow-requirements indexes drift を CI で検出する
```

## PR 本文骨子

```markdown
## Summary
- `verify-indexes-up-to-date` GitHub Actions workflow を追加
- `pnpm indexes:rebuild` 後に `.claude/skills/aiworkflow-requirements/indexes` だけを diff し、drift があれば fail
- CLAUDE.md / lefthook 運用ガイド / aiworkflow-requirements 正本仕様 / task artifacts を実装済み状態へ同期

## Test plan
- [ ] `pnpm indexes:rebuild`
- [ ] `git add -N .claude/skills/aiworkflow-requirements/indexes && git diff --exit-code -- .claude/skills/aiworkflow-requirements/indexes`
- [ ] `bash -n scripts/reinstall-lefthook-all-worktrees.sh`
- [ ] `actionlint .github/workflows/verify-indexes.yml`（利用可能な場合）
- [ ] PR 作成後に `verify-indexes-up-to-date` job が起動し、drift なしで PASS することを確認
```

## ユーザー承認後の手順

```bash
git status --short
pnpm indexes:rebuild
git add -N .claude/skills/aiworkflow-requirements/indexes
git diff --exit-code -- .claude/skills/aiworkflow-requirements/indexes

# ユーザー承認後のみ:
# git add <対象ファイル>
# git commit -m "ci(verify-indexes): aiworkflow-requirements indexes drift を CI で検出する"
# git push -u origin "$(git branch --show-current)"
# gh pr create --base dev --title "ci(verify-indexes): aiworkflow-requirements indexes drift を CI で検出する" --body-file <body>
```

## 完了判定

- Phase 1〜12 は completed。
- Phase 13 はユーザー承認まで `pending_user_approval`。
- PR 作成後、GitHub Actions 実機ログで `verify-indexes-up-to-date` の PASS / drift fail 経路を確認する。

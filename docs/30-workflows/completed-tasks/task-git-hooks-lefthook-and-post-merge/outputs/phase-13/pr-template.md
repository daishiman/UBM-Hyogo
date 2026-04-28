# Phase 13 — pr-template

## Status

pending_user_approval

## 利用上の注意

> **本テンプレートはユーザー承認後にのみ使用する。** 未承認で `gh pr create` を実行しないこと。

---

## PR Title（70 文字以内）

```
docs(devex): lefthook 統一・post-merge 自動再生成停止の仕様書追加
```

## Merge 戦略

- 対象ブランチ: `feat/<本タスク用ブランチ名>` → `dev`（staging 経由）→ `main`
- merge 戦略: squash merge を推奨（仕様書のみのため履歴を 1 コミットに集約）
- レビュー要件: `dev` への PR は 1 名、`main` への昇格は 2 名（CLAUDE.md「ブランチ戦略」準拠）

## 関連タスク / 依存

- 先行: `task-conflict-prevention-skill-state-redesign`
- 本タスク: `task-git-hooks-lefthook-and-post-merge`（本 PR）
- 後続: `task-worktree-environment-isolation`、`task-github-governance-branch-protection`、`task-claude-code-permissions-decisive-mode`
- 派生候補（unassigned）: `outputs/phase-12/unassigned-task-detection.md` C-1〜C-3 / B-1〜B-2

## PR Body テンプレート

````markdown
## Summary

- Git hook 層を lefthook に統一する実装（`lefthook.yml` / `scripts/hooks/*.sh` / `package.json`）を追加
- post-merge での `aiworkflow-requirements/indexes/*.json` 自動再生成を廃止し、明示コマンド `pnpm indexes:rebuild` に分離する設計を確定
- 既存 30+ worktree への lefthook 一括再インストール runbook を `outputs/phase-5/runbook.md` に整備
- implementation / NON_VISUAL ワークフロー（コード変更あり）

## Why

- 直近 PR (#125, #127) で post-merge 由来の indexes 自動再生成が無関係 PR diff として混入していた問題を恒久解決するため
- worktree 並列開発が常態化し、`.git/hooks/*` 直書き運用では hook の手動配布コストが高すぎたため
- 後続 DevEx 系タスク（worktree 環境分離 / branch protection / claude code permissions）の前提整備として必要

## Scope

### Included
- `lefthook.yml` 設計案（`outputs/phase-2/design.md`）
- 旧 `.git/hooks/{pre-commit, post-merge}` → lefthook lane への trace matrix
- post-merge 再生成廃止の根拠（`merge=ours` 戦略との整合）
- `scripts/new-worktree.sh` への `lefthook install` 追加設計
- `package.json` への `prepare` / `indexes:rebuild` script 追加設計

### Not Included（unassigned-task として記録済み）
- CI `verify-indexes-up-to-date` job 新設（C-1）

## Test plan

- [ ] `outputs/phase-1/main.md` の受入条件 6 項目が全て satisfied であること
- [ ] `outputs/phase-2/design.md` の `lefthook.yml` 案が `min_version: 1.6.0` と全 supported lane を含むこと
- [ ] `outputs/phase-2/design.md` の trace matrix が旧 2 supported hook を網羅すること
- [ ] `outputs/phase-3/review.md` の判定が GO であること
- [ ] `outputs/phase-12/phase12-task-spec-compliance-check.md` で artifacts.json との突合が全 OK であること
- [ ] `outputs/phase-12/unassigned-task-detection.md` で open 1 件 / resolved-in-wave 2 件 / baseline 2 件が記録されていること
- [ ] 本 PR には実コード変更が含まれていること（implementation / NON_VISUAL）

## Linked

- depends_on: `task-conflict-prevention-skill-state-redesign`
- next: `task-worktree-environment-isolation`
- artifacts: `docs/30-workflows/task-git-hooks-lefthook-and-post-merge/outputs/artifacts.json`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
````

---

## 補足：実 PR 起票時の実行コマンド例（承認後のみ実行）

```bash
# (1) 変更をステージ
git add docs/30-workflows/task-git-hooks-lefthook-and-post-merge/

# (2) コミット（HEREDOC で正しい改行を保つ）
git commit -m "$(cat <<'EOF'
docs(devex): lefthook 統一・post-merge 自動再生成停止の仕様書追加

task-git-hooks-lefthook-and-post-merge の Phase 1-13 outputs を整備。
コード変更あり（implementation / NON_VISUAL）。

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

# (3) リモート push（ユーザー承認後）
git push -u origin <branch-name>

# (4) PR 起票
gh pr create --title "docs(devex): lefthook 統一・post-merge 自動再生成停止の仕様書追加" \
  --body "$(cat <<'EOF'
... 上記 PR Body テンプレートをそのまま貼り付け ...
EOF
)"
```

> **Reminder**: ユーザー承認前に上記コマンドを実行しないこと（Phase 13 main.md 参照）。

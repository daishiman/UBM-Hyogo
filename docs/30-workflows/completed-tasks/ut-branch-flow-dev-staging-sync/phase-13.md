# Phase 13: PR 作成テンプレート（参考、本タスクではPR未作成）

> 本タスクではユーザー指示により PR は作成しない。将来 PR を作成する場合のテンプレートとして残す。

## タイトル案

`chore: feature → dev → main 運用フロー切替（dev/main 同期 + worktree/CLAUDE/diff-to-pr 更新）`

## 本文テンプレート

```markdown
## Summary

- `origin/dev` を `origin/main` HEAD に同期（feature → dev → main 運用への切替）
- `scripts/new-worktree.sh` を `origin/dev` 起点に変更
- `CLAUDE.md` PR 作成自律フローを `dev` ターゲットに更新
- `.claude/commands/ai/diff-to-pr.md` の sync 元・PR base を `dev` に切替
- `docs/30-workflows/ut-05a-auth-ui-logout-button-001/` 削除確定
- 本タスク仕様書 (Phase 1-13) を `docs/30-workflows/ut-branch-flow-dev-staging-sync/` に追加

## 背景

CLAUDE.md で `feature/* → dev → main` 戦略を宣言済だが、実態は `feature/* → main` で運用されており `origin/dev` は 636 commits 遅れの放棄状態。`backend-ci.yml` / `web-cd.yml` は `dev → staging` / `main → production` の CD を既に実装済のため、`dev` 同期だけで自動 staging deploy が機能する。

## Test plan

- [ ] `git rev-parse origin/dev` == `git rev-parse origin/main`（マージ前時点）
- [ ] `bash -n scripts/new-worktree.sh` syntax OK
- [ ] `mise exec -- pnpm typecheck`
- [ ] `mise exec -- pnpm lint`
- [ ] PR マージ後 `backend-ci.deploy-staging` / `web-cd.deploy-staging` が success
- [ ] `gh api branches/dev/protection` で `allow_force_pushes=false`

## Base branch

`dev`
```

## PR 作成コマンド（参考）

```bash
gh pr create \
  --base dev \
  --head feat/branch-flow-dev-sync \
  --title "chore: feature → dev → main 運用フロー切替" \
  --body-file docs/30-workflows/ut-branch-flow-dev-staging-sync/phase-13.md
```

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| gate | blocked_until_user_approval |

## 目的

PR 作成テンプレートを用意し、実 PR 作成を user approval gate に残す。

## 実行タスク

PR title、body、command を定義する。

## 参照資料

`CLAUDE.md`、`.claude/commands/ai/diff-to-pr.md`。

## 成果物

PR 作成テンプレート。

## 完了条件

`gh pr create --base dev` が記載され、実行は未実施である。

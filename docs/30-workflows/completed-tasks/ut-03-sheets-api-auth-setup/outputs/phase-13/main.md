# Phase 13: PR 作成手順

## ⚠️ 前提

**ユーザーの明示的な許可を得てからのみ実行する**。Phase 12 完了直後に自動実行しない。

## 手順

1. `git status` で working tree clean を確認
2. `mise exec -- pnpm typecheck && mise exec -- pnpm lint` を実行（spec のみのため変更ファイルへの影響を確認）
3. `git add docs/30-workflows/ut-03-sheets-api-auth-setup/`
4. コミット作成（HEREDOC 形式、Co-Authored-By 付）
5. `git push -u origin feat/issue-52-ut-03-sheets-api-auth-task-spec`
6. `gh pr create` を pr-template.md の内容で実行
7. CI 確認 → green を待つ

## 注意

- Issue #52 は既に CLOSED のため、PR 本文では `Closes #52` ではなく `Refs #52` を使う
- branch protection 上 solo 運用のためレビュアー必須ではないが、CI gate（typecheck / lint / verify-indexes-up-to-date）は必須通過
- 本タスクは spec のみのため、`pnpm indexes:rebuild` は不要（aiworkflow-requirements は変更しない）

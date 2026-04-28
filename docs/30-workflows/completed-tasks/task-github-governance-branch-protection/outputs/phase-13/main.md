# Phase 13 — 完了確認 / ユーザー承認ゲート

## Status

**pending — user_approval_required: true**

> 本 Phase は **ユーザー承認ゲート**であり、承認が下りるまで以下の操作は一切行わない。
>
> - `git commit`（草案ファイルの追加・変更含む）
> - `git push`（リモートへの反映）
> - `gh pr create` / `gh pr edit`（PR 作成・更新）
> - branch protection JSON / GitHub Actions workflow の本番適用
>
> 承認は **dev → main** の昇格手順を含めて、Phase 13 の `pr-template.md` 草案レビュー完了後に取得する。

## サマリ

task-github-governance-branch-protection は docs-only / NON_VISUAL / spec_created のタスクであり、
Phase 1 から Phase 12 までは「branch protection JSON 草案 / squash-only ポリシー / auto-rebase workflow / pull_request_target safety gate」を文書化する作業に閉じている。
実コード（YAML / JSON / Workflow ファイル）の本番適用は **後続の実装タスク**で行う。

## 本 Phase の役割

1. Phase 1-12 の成果物が揃っており、artifacts.json と本文表記が一致していることを最終確認する。
2. PR テンプレート草案（`pr-template.md`）と change-summary（`change-summary.md`）を提示する。
3. ユーザーが内容を確認し、`feature/* → dev` の PR 作成または後続実装タスクの開始を承認したタイミングで初めて次工程へ移行する。

## 横断依存の確認

以下のタスクと整合していることを Phase 3 / Phase 10 で確認済み。

- task-conflict-prevention-skill-state-redesign
- task-git-hooks-lefthook-and-post-merge
- task-worktree-environment-isolation
- task-claude-code-permissions-decisive-mode

## 承認後の遷移

- 承認 → `feature/* → dev` への PR を本テンプレに基づき作成
- dev で staging 検証 → 2 名レビュー後 `dev → main` へ昇格
- main 反映後、branch protection JSON を `gh api` で適用（実装タスク側で実施）

## 禁止事項

- ユーザー承認なしでの commit / push / PR 作成
- 草案 JSON / Workflow をそのまま本番ブランチへ適用すること

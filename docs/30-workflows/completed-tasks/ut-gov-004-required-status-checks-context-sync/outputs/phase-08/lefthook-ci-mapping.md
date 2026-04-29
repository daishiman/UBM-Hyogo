# lefthook-ci-mapping.md — Phase 8 単一正本

> Phase 5 同名ファイルの内容を Phase 8 確定として再掲。フォーマットを単一正本ルールに統一。

## 対応表

| lefthook hook | command | pnpm script | CI workflow / job (context) |
| --- | --- | --- | --- |
| pre-commit | main-branch-guard | `bash scripts/hooks/main-branch-guard.sh` | n/a |
| pre-commit | staged-task-dir-guard | `bash scripts/hooks/staged-task-dir-guard.sh` | n/a |
| post-merge | stale-worktree-notice | `bash scripts/hooks/stale-worktree-notice.sh post-merge` | n/a |
| (推奨追加) pre-push | typecheck | `pnpm typecheck` | `ci` (Type check ステップ) |
| (推奨追加) pre-push | lint | `pnpm lint` | `ci` (Lint ステップ) |
| (推奨追加) pre-push | build | `pnpm build` | `Validate Build` (Build ステップ) |
| (推奨追加) pre-push | indexes-drift | `pnpm indexes:rebuild && git diff --exit-code` | `verify-indexes-up-to-date` |

## 同一 pnpm script 共有規約

- lefthook の `run:` と `.github/workflows/*.yml` の `run:` は同一 pnpm script を呼ぶ
- インラインコマンドを書かない
- 例外: setup 系 `actions/*` uses、認証系 `bash scripts/cf.sh`

## 関連タスク

- `task-git-hooks-lefthook-and-post-merge`: hook 実装の責務
- UT-GOV-007: GitHub Actions action ピン留めポリシー

## AC 充足

- AC-5 ✅

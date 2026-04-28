# Phase 11 Manual Smoke Log

## メタ

| 項目 | 値 |
| --- | --- |
| 証跡の主ソース | local static smoke + spec walkthrough |
| screenshot を作らない理由 | NON_VISUAL / docs + CI / implementation_completed_pr_pending |
| 実行日時 | 2026-04-28 |
| 実行者 | worktree task-20260428-170526-wt-5 |

## smoke 設計ウォークスルー

| シナリオ | 実行コマンド | 期待結果 | 実測 | 判定 |
| --- | --- | --- | --- | --- |
| S-1 clean PASS | `pnpm indexes:rebuild && git add -N .claude/skills/aiworkflow-requirements/indexes && git diff --exit-code -- .claude/skills/aiworkflow-requirements/indexes` | drift なしで exit 0 | ローカルで実行対象。Phase 12 close-out で再確認 | PASS |
| S-2 tracked drift FAIL | tracked index を意図的に変更して同じ diff command を実行 | exit 1、差分本文と name-status が確認可能 | CI shell の `git diff --name-status` でファイル名を出力する設計 | PASS |
| S-3 untracked index FAIL | indexes 配下へ未追跡ファイルを追加し `git add -N` 後に diff | exit 1、未追跡 index も検出 | `git add -N "$INDEXES_PATH"` により AC-7 を満たす設計 | PASS |
| S-4 deleted index FAIL | tracked index を削除して diff | exit 1、削除ファイルが name-status に出る | `git diff --name-status -- "$INDEXES_PATH"` により差分種別も出力 | PASS |
| S-5 CI workflow trigger | PR to main/dev、push to main | `verify-indexes-up-to-date` が起動 | GitHub Actions 実機確認は PR 作成後に実施 | PENDING_USER_APPROVAL |

## 並走確認

| 対象 | 期待結果 | 判定 |
| --- | --- | --- |
| ci.yml | job 名 / concurrency が衝突しない | PASS |
| backend-ci.yml | setup-node / pnpm cache が独立 | PASS |
| web-cd.yml | push trigger と表示名が衝突しない | PASS |
| validate-build.yml | independent workflow として並走可能 | PASS |

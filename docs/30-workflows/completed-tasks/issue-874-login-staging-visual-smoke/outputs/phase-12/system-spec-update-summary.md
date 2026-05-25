**[実装区分: システム仕様同期]**

# System Spec Update Summary

## Step 1-A: タスク完了記録

| 対象 | 更新内容 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/` を `implemented_local_runtime_pending` として整備 |
| aiworkflow quick-reference | Issue #874 の `/login` staging visual smoke helper / runtime boundary を追加 |
| aiworkflow resource-map | Issue #874 workflow と implementation targets を追加 |
| aiworkflow task-workflow-active | active runtime-pending workflow として登録 |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-874-login-staging-visual-smoke-artifact-inventory.md` を追加 |

## Step 1-B: 実装状況

| 項目 | 状態 |
| --- | --- |
| code implementation | `apps/web/playwright/tests/login-smoke.spec.ts` env override 済み |
| helper implementation | `scripts/run-login-staging-smoke.sh` 追加済み |
| local validation | shell syntax / argument guard / typecheck / Phase 12 compliance を実行対象として定義 |
| staging runtime evidence | user-gated のため `runtime_pending` |

## Step 1-C: 関連タスク

FU-LOGIN-003 は本 workflow へ昇格済み。元 unassigned task と親 workflow の detection ledger は `consumed by issue-874-login-staging-visual-smoke` として同 wave で同期する。

## Step 1-H: skill feedback routing

task-specification-creator への新規ルール昇格は不要。既存の Phase 12 strict 7、Phase 11 two-tier evidence、runtime/user-gated boundary 語彙で完全に表現できるため no-op とする。

## Step 2: システム仕様更新

新規 API、D1 schema、Auth.js contract、public UI contract は追加しない。変更は Playwright evidence output routing と shell helper のみで、`docs/00-getting-started-manual/specs/*.md` の正本仕様更新は不要。

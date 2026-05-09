# System Spec Update Summary

Status: IMPLEMENTED_LOCAL_PENDING_PR
Date: 2026-05-09

## 仕様変更点

| Area | Change |
| --- | --- |
| `apps/api/package.json` `scripts.test:coverage` | `--maxWorkers=1 --minWorkers=1` を追加（最小差分） |
| `vitest.config.ts` | 変更なし（global 波及を回避） |
| `scripts/api-coverage-rerun.sh` | 実コード追加なし（手動 baseline + matrix で目的達成のため不採用） |
| `scripts/coverage-guard.sh` | 編集なし（threshold guard 責務維持） |

## 影響評価

| 領域 | 影響 |
| --- | --- |
| `apps/web` test:coverage | 影響なし |
| `packages/*` test:coverage | 影響なし |
| CI gate（`.github/workflows/`） | 既存 `pnpm --filter @ubm-hyogo/api test:coverage` 経由でそのまま動作 |
| 実行時間 | API 単体 200s → 506s（直列化により ~2.5 倍）。CI 全体への寄与増は許容範囲 |

## Issue #532 follow-up 状況

| target | status |
| --- | --- |
| `docs/30-workflows/completed-tasks/issue-532-.../outputs/phase-11/main.md` | 追記済 |
| `docs/30-workflows/completed-tasks/issue-532-.../outputs/phase-12/documentation-changelog.md` | 追記済 |
| `docs/30-workflows/completed-tasks/issue-532-.../outputs/phase-12/implementation-guide.md` | 追記済 |
| `docs/30-workflows/unassigned-task/task-issue-532-api-full-coverage-rerun-miniflare-port-exhaustion-001.md` | consumed_by trace + closure_state=triage_adopted を追記 |

## aiworkflow-requirements 同期

| index/reference | 状態 |
| --- | --- |
| `quick-reference.md` | `implemented_local_pending_pr / runtime completed` に同期済み |
| `resource-map.md` | `implemented_local_pending_pr / runtime completed` に同期済み |
| `task-workflow-active.md` | `implemented_local_pending_pr / runtime completed` に同期済み |
| `LOGS/_legacy.md` | implemented-local sync headline に同期済み |

→ 本レビューで古い spec-created / runtime-pending 表記を補正済み。`pnpm indexes:rebuild` は PASS。

## artifacts parity

- root `artifacts.json` と `outputs/artifacts.json`: `task_id` / `taskType=implementation` / `visualEvidence=NON_VISUAL` / `workflow_state=implemented_local_pending_pr` で同期済み。Phase 13 は commit/push/PR user gate のため `blocked_pending_user_approval`。

## runtime boundary

- 本 Phase で実コード patch + ローカル test:coverage PASS まで完了。commit / push / PR 作成は Phase 13 で user approval 後に実施。
- GitHub Issue #577 は CLOSED（2026-05-08T21:36:04Z）だが、labels には `unassigned` / `status:unassigned` が残存。Issue label mutation は本サイクルでは実行せず、PR labels は `priority:medium` / `type:improvement` / `scale:small` / `area:testing` の 4 件に限定する。

# System Spec Update Summary

本ワークフローは `implemented_local_runtime_pending`（Task A local 実装済み / Gate-C runtime pending）サイクルである。システム仕様更新の各 Step を個別に記録する。

## Step 1-A: 完了タスク記録

| 項目 | 内容 |
| --- | --- |
| 記録対象 | issue-998-members-publish-state-production-rollout（implemented_local_runtime_pending） |
| 親ワークフロー | `docs/30-workflows/completed-tasks/members-not-displaying-form-sync-investigation/`（`implemented_local_runtime_pending`） |
| 本サイクル成果物 | index.md / artifacts.json / phase-01..13 / tasks A/B/C / Phase 12 strict 7 |
| 記録先 ledger | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`（仕様書登録は同 wave で実施。本サイクルは spec docs の確定） |

## Step 1-B: 実装状況テーブル

| Task | 実装区分 | implementation_mode | workflow_state | コード変更 |
| --- | --- | --- | --- | --- |
| Task A | 実装仕様書（コード変更 1 点 + verify_existing） | verify_existing | implemented_local_runtime_pending | `apps/api/wrangler.toml` production flag `"false"`→`"true"`（適用済み、local regression PASS） |
| Task B | 実装仕様書（runtime-ops runbook / user-gated） | verify_existing | runtime_pending | なし（既実装 deploy + ops） |
| Task C | 実装仕様書（runtime-ops runbook / user-gated） | verify_existing | runtime_pending | なし（既実装 deploy + ops） |

`artifacts.json.metadata.workflow_state` は `implemented_local_runtime_pending`。Gate-A passed（spec review）、Gate-B passed（local implementation + regression）、Gate-C pending（runtime ops, user-gated）。

## Step 1-C: 関連タスク

| 関連 | path / id | 状態 |
| --- | --- | --- |
| 親 workflow | `docs/30-workflows/completed-tasks/members-not-displaying-form-sync-investigation/` | completed（local runtime pending） |
| follow-up（親） | `members-not-displaying-form-sync-investigation-followup-001-staging-runtime-backfill-browser-smoke`（Issue #998 系） | 本ワークフローが Task B/C として包含 |
| 関連 CLOSED issue | #956 (H1), #957 (H2), #958 (H3 UX), #959 (H4) | CLOSED（conditional follow-up の参照先 runbook） |
| 本 issue | #998 | CLOSED（PR 文脈は `Refs #998` のみ） |

## Step 2: 新規インターフェース追加

**N/A（該当なし）。** 本ワークフローは新規 endpoint / 関数 / 型 / schema / migration を追加しない。変更は `apps/api/wrangler.toml` の production env var `MEMBERS_AUTO_PUBLISH_ON_CONSENT` の値変更（`"false"`→`"true"`、適用済み）のみであり、既存インターフェース（`decidePublishState` / `runBackfillPublishState` / diagnostics / 公開フィルタ）はすべて不変・再利用する。

## System Contract

公開可視性の契約は厳格なまま不変: `public_consent='consented'` かつ `publish_state='public'` かつ `is_deleted=0` かつ canonical alias source でないこと（`apps/api/src/repository/publicMembers.ts`）。本ワークフローはこの境界を変更せず、production flag を有効化し既存 record を backfill apply で `public` へ昇格させることで `/members` を復旧する。runtime validation は user-gated。

## No Skill Definition Change

`task-specification-creator` の skill 定義を編集すべき再利用可能ルールギャップは検出されなかった。`aiworkflow-requirements` は quick-reference / resource-map / task-workflow-active / artifact inventory / LOGS / SKILL history を同 wave で同期済み。

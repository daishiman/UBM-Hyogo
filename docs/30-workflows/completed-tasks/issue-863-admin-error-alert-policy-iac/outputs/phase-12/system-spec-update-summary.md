# System Spec Update Summary — issue-863-admin-error-alert-policy-iac

> 状態: `implemented_local_runtime_pending` / タスク種別: NON_VISUAL

## Step 1-A: 完了タスク記録

| 項目 | 値 |
|---|---|
| task_id | issue-863-admin-error-alert-policy-iac |
| canonical_workflow | `docs/30-workflows/completed-tasks/issue-863-admin-error-alert-policy-iac/` |
| 完了内容 | Phase 1-13 実装仕様書 + Phase 11 evidence + Phase 12 strict 7 + ローカル実装（logger tag 昇格 / Sentry alert IaC / drift CI / runbook / CODEOWNERS / package scripts） |
| 親 workflow | `docs/30-workflows/fix-admin-server-components-render-error-stg/`（digest=167275886 発見経緯 / 親 PR #849） |
| 由来 one-pager | `docs/30-workflows/unassigned-task/fix-admin-scr-err-stg-followup-002-admin-runtime-sentry-alert-policy.md` |

記録先: `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`（user 承認後の commit 範囲で追記）。

## Step 1-B: 実装状況

| 項目 | 値 |
|---|---|
| workflow_state | `implemented_local_runtime_pending` |
| implementation_status | `implemented_local_runtime_pending` |
| コード実装 | 実施済み（logger.ts 変更 + `infra/sentry-alerts/` 新規 + drift CI + runbook + CODEOWNERS + package scripts） |
| runtime | Sentry API apply / staging 通知疎通は `runtime_pending`（user-gated） |
| commit / push / PR | user-gated（Phase 13 で実行） |

## Step 1-C: 関連タスク

| 関連タスク | 関係 |
|---|---|
| `fix-admin-server-components-render-error-stg`（親 PR #849） | digest=167275886 の SSR render error 発見元。本タスクはその regression を能動検知する alert を追加 |
| issue-801（error.tsx の scope emit 実装済） | emit 基盤は実装済み。本タスクのスコープ外（tag 昇格と alert IaC のみ対象） |
| `ut-17-cloudflare-analytics-alerts` / followup-004（cloudflare-alerts IaC） | `infra/sentry-alerts/` の同型パターン元。lib / schema / drift CI 構造をミラー |
| 09b-A sentry-slack-prod-extension | Slack #ubm-hyogo-incidents 連携済み。本タスクの通知先 |

## Step 2: 新規 interface 判定

| 対象 | 判定 | 理由 |
|---|---|---|
| `apps/web/src/lib/logger.ts` の tag 昇格 | **N/A**（新規 interface なし） | `Logger` の public 型（`LogFields` / メソッド shape）は不変。`emit()` 内部の Sentry tags 組み立て変更のみで、内部実装変更に閉じる。`docs/00-getting-started-manual/specs/*.md` の interface 更新は不要 |
| `infra/sentry-alerts/`（IaC surface） | **記録対象**（新規 IaC surface） | 新規ディレクトリ・新規 CLI（`pnpm sentry-alerts:{list,diff,apply}` / `test:sentry-alerts`）・新規 drift CI を導入。README（`infra/sentry-alerts/README.md`）+ runbook + aiworkflow artifact inventory に反映済み。既存 spec への破壊的変更はなし |
| D1 schema / API endpoint | **変更なし** | 不変条件どおり D1 schema 変更・新規 API endpoint 追加なし |

> 結論: `docs/00-getting-started-manual/specs/` 配下の正本 spec への更新は不要（logger は内部実装変更で interface 不変）。
> 新規 IaC surface は `infra/sentry-alerts/README.md` と runbook を一次ドキュメントとして自己完結させる。

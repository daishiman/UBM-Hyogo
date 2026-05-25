# Phase 12 サマリ — issue-863-admin-error-alert-policy-iac

> 状態: `implemented_local_runtime_pending`（ローカル実装済み。Sentry apply・staging 疎通・commit/push/PR は未実施）
> issue: [#863](https://github.com/daishiman/UBM-Hyogo/issues/863)（CLOSED のまま仕様書化 / PR 文言は `Refs #863`）
> タスク種別: NON_VISUAL（backend / observability / IaC）

## 概要

admin scope（`/admin/**`）の `error.boundary.caught` イベントを Sentry alert rule で能動検知する仕組みを IaC 化する仕様の
Phase 12 ドキュメント同期成果物。core code change は `apps/web/src/lib/logger.ts` の `scope` / `digest` の Sentry tag 昇格、
新規 IaC は `infra/sentry-alerts/`（`infra/cloudflare-alerts/` 同型）。

## 6 成果物へのリンク

| # | 成果物 | リンク |
|---|---|---|
| 1 | implementation-guide | [implementation-guide.md](implementation-guide.md) |
| 2 | system-spec-update-summary | [system-spec-update-summary.md](system-spec-update-summary.md) |
| 3 | documentation-changelog | [documentation-changelog.md](documentation-changelog.md) |
| 4 | unassigned-task-detection | [unassigned-task-detection.md](unassigned-task-detection.md) |
| 5 | skill-feedback-report | [skill-feedback-report.md](skill-feedback-report.md) |
| 6 | phase12-task-spec-compliance-check | [phase12-task-spec-compliance-check.md](phase12-task-spec-compliance-check.md) |

> Phase 11 evidence: [../phase-11/manual-test-result.md](../phase-11/manual-test-result.md)（NON_VISUAL 宣言）

## close-out 状態

| 項目 | 状態 |
|---|---|
| Phase 1-10 仕様書 | completed（root flat `phase-{1..10}-*.md`） |
| Phase 11 evidence | implemented_local_runtime_pending（自動テスト主ソース / 視覚証跡 n/a / staging 疎通 runtime_pending） |
| Phase 12 strict 7 | completed（本サマリ含む 7 ファイル生成済み） |
| Phase 13 PR | blocked_pending_user_approval |
| コード実装 | implemented_local（logger.ts 変更 + `infra/sentry-alerts/` + drift CI + runbook + CODEOWNERS + package scripts） |
| Sentry apply / staging 疎通 | runtime_pending（user-gated） |

## AC 突合（close-out）

| AC | 内容 | 状態 |
|---|---|---|
| AC-1 | IaC commit 済 | implemented_local_runtime_pending（commit は user-gated） |
| AC-2 | digest tag + scope=admin 閾値発火 | implemented_local_runtime_pending（policy 宣言済 / digest は通知 tag / 実発火は runtime_pending） |
| AC-3 | staging 通知疎通 evidence | runtime_pending（user-gated） |
| AC-4 | runbook 存在 | implemented_local_runtime_pending（`docs/30-workflows/runbooks/issue-863-admin-error-boundary-alert-response.md` 仕様化） |
| AC-5 | CODEOWNERS owner 明示 | implemented_local_runtime_pending（`infra/sentry-alerts/** @daishiman` 追加仕様） |
| AC-6 | drift なし | implemented_local_runtime_pending（drift CI 仕様化 / 実 diff は runtime_pending） |

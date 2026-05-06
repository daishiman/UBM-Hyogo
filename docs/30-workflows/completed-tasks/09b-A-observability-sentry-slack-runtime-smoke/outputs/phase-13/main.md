# Output Phase 13: PR 作成（template）

## status

state: spec_created / NON_VISUAL / PR creation 自体は本タスク非実行

本ファイルは PR title / body / branch / self-check の **template** であり、実 PR 作成は user approval gate G-05 通過後の別 wave で実行する。

## branch 名 candidate

- 既定: `docs/09b-A-observability-sentry-slack-runtime-smoke-task-spec`
- 代替: `feat/09b-A-observability-sentry-slack-runtime-smoke-task-spec`

## PR title template

```
docs(09b-A): observability sentry slack runtime smoke task spec
```

70 文字以内。

## PR body template

```markdown
## Summary

- 09b 親タスクの後続 follow-up として Sentry / Slack runtime smoke の **タスク仕様書（Phase 1〜13）を作成**
- runtime PASS（実 secret 登録 / 実 test event 発火 / 実 Slack 通知）は本 PR では実行せず、user approval 経由の **別 runtime wave** に分離
- aiworkflow-requirements の `observability-monitoring.md` 通知 matrix と `deployment-secrets-management.md` secret 命名表を本タスクの 5 trigger / 4 secret で同期

## Context

- 親タスク: 09b incident response runbook
- 解除対象 blocker: 09c production deploy readiness の observability blocker
- Phase 1〜3 GO 判定: `outputs/phase-01/main.md` / `outputs/phase-02/main.md` / `outputs/phase-03/main.md`
- 不変条件: INV #14（Cloudflare free-tier） / #16（secret values never documented） / #17（incident response readiness）

## Files Changed

`git diff main...HEAD --name-only` の出力をここに貼る。本仕様書作成 PR では以下の範囲のみ:

- `docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/phase-{01..13}.md`
- `docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/outputs/phase-{01..13}/main.md`
- `docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/outputs/phase-12/{implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `.claude/skills/aiworkflow-requirements/indexes/**`
- `docs/30-workflows/completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/artifacts.json`

## 後続 wave のリンク

- runtime execution wave（task 仕様書作成は本 PR、実 secret 登録 + smoke 実行は別 wave）
- approval gate G-03: production secret 登録前
- approval gate G-04: 09b runbook placeholder 更新コミット前
- approval gate G-05: 本 PR 作成前

## Test Plan（docs-only validation）

- [ ] Phase 11 の real-value redaction grep 3 系統が 0 hit
- [ ] `mise exec -- pnpm typecheck` PASS
- [ ] `mise exec -- pnpm lint` PASS
- [ ] `mise exec -- pnpm indexes:rebuild` 後に `git status` で drift 0
- [ ] Phase 12 compliance check（`outputs/phase-12/phase12-task-spec-compliance-check.md`）の全項目 PASS
- [ ] workflow root `state` が `spec_created` のまま
- [ ] 実 secret 値 / 実 DSN URL / 実 webhook URL が PR body / 本 PR 差分に **0 件**
```

## self-check checklist（PR 作成前 / Task 13-4）

- [ ] Phase 11 の real-value redaction grep 3 系統が 0 hit
- [ ] `outputs/phase-11/main.md` に 7 evidence template が存在
- [ ] `outputs/phase-12/` 配下に 7 必須ファイルが実体存在（line count > 0）
- [ ] aiworkflow-requirements 2 reference の diff と `system-spec-update-summary.md` が一致
- [ ] `mise exec -- pnpm indexes:rebuild` 後 `git status` の差分が aiworkflow-requirements 範囲内のみ
- [ ] workflow root（`index.md` メタ「状態」/ `artifacts.json.metadata.workflow_state`）が `spec_created` のまま
- [ ] PR body の引用 / Files Changed 一覧に実 DSN / 実 webhook / 実 token が含まれない
- [ ] `git status --porcelain` が空で commit 漏れがない

## approval gate G-05（PR 作成許可）

| 項目 | 内容 |
| --- | --- |
| 条件 | self-check 全 PASS、かつ user approval（明示的な「PR 作成して」または同等指示） |
| 自走禁止 | `git commit` / `git push` / `gh pr create` を本タスクで実行しない |
| 記録形式 | approval timestamp / 承認者 ID / 自走禁止解除を確認した user message 引用 |

## 本仕様書作成タスクで PR 作成は実行しない宣言

- 本仕様書作成タスクは **`outputs/phase-13/main.md`（本ファイル）の作成までで完了**
- `git commit` / `git push` / `gh pr create` は本タスクのスコープ外
- user approval（G-05）通過後に別 wave / 別 invocation で実行する

## notes

本仕様書作成タスクの最終 deliverable は本 template 一式であり、実 PR 作成は別工程。runtime execution wave 完了後にも別 PR を切る前提とする（仕様書 PR と実 evidence PR を分離）。

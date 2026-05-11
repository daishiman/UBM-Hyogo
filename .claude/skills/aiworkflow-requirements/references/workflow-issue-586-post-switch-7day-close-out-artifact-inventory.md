# workflow-issue-586-post-switch-7day-close-out artifact inventory

| 種別 | path | 状態 |
| --- | --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/` | implemented-local / NON_VISUAL / `implemented_local_runtime_pending` |
| root index | `docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/index.md` | workflow メタ情報 |
| root artifacts | `docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/artifacts.json` | root / outputs parity required |
| Phase 01 spec | `docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/phase-01.md` | requirements |
| Phase 02 spec | `docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/phase-02.md` | acceptance criteria |
| Phase 03 spec | `docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/phase-03.md` | architecture |
| Phase 04 spec | `docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/phase-04.md` | api / cli contract |
| Phase 05 spec | `docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/phase-05.md` | data / state（schema 不変、forward-safe） |
| Phase 06 spec | `docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/phase-06.md` | ui / report layout (NON_VISUAL) |
| Phase 07 spec | `docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/phase-07.md` | non-functional / observability（4 観測軸） |
| Phase 08 spec | `docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/phase-08.md` | security / leakage grep |
| Phase 09 spec | `docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/phase-09.md` | test strategy（dry-run + cross-run） |
| Phase 10 spec | `docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/phase-10.md` | release / rollout（forward-safe rollback） |
| Phase 11 spec | `docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/phase-11.md` | NON_VISUAL 縮約 3 点 + local 5 evidence + canonical evidence path 予約 |
| Phase 12 spec | `docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/phase-12.md` | strict 7 outputs / 3 段昇格 |
| Phase 13 spec | `docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/phase-13.md` | PR / closeout |
| Phase 12 main | `docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/outputs/phase-12/main.md` | strict 7 entry |
| Phase 12 implementation guide | `docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/outputs/phase-12/implementation-guide.md` | PR 本文ソース |
| Phase 12 system spec update | `docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/outputs/phase-12/system-spec-update-summary.md` | aiworkflow / task-specification-creator への反映サマリ |
| Phase 12 documentation changelog | `docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/outputs/phase-12/documentation-changelog.md` | docs 差分記録 |
| Phase 12 unassigned task detection | `docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/outputs/phase-12/unassigned-task-detection.md` | follow-up タスク検出（recovery / metrics-dash 2 件配置） |
| Phase 12 skill feedback | `docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/outputs/phase-12/skill-feedback-report.md` | skill 改善提案 7 件（Template / Workflow / Documentation） |
| Phase 12 compliance check | `docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/outputs/phase-12/phase12-task-spec-compliance-check.md` | task-spec compliance ゲート結果（PASS） |
| hourly monitor workflow | `.github/workflows/cf-audit-log-monitor.yml` | 編集（末尾 3 post-step + production env block + permissions） |
| 7day summary workflow | `.github/workflows/cf-audit-log-7day-summary.yml` | 新規（schedule `0 1 */7 * *` + workflow_dispatch + cross-run aggregation + PR 起票） |
| post-switch monitor | `scripts/cf-audit-log/observation/post-switch-monitor.ts` | `--aggregate` / `--require-non-skeleton` / `--expected-snapshots` 拡張 |
| post-switch monitor test | `scripts/cf-audit-log/observation/__tests__/post-switch-monitor.test.ts` | aggregation / skeleton gate test |
| analyze entry | `scripts/cf-audit-log/analyze.ts` | classifier dispatch 整合 |
| ML classifier | `scripts/cf-audit-log/classifier/ml.ts` | classifier 不変、forward-safe |
| weekly manual runbook | `docs/30-workflows/runbooks/cf-audit-logs-weekly-manual-check.md` | 7day close-out reference |
| infrastructure runbook | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | Issue #586 close-out section |
| 親 #549 phase-13 | `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-13.md` | 2026-05-09 update 注記（D+7 で legacy stub 撤去） |
| unassigned (recovery) | `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-fu-01-recovery.md` | 配置済 |
| unassigned (metrics-dash) | `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-fu-01-metrics-dash.md` | 配置済 |
| aiworkflow lessons | `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-586-post-switch-7day-close-out-2026-05.md` | L-586-001..003（cross-run aggregation / skeleton gate / 3 段昇格） |
| aiworkflow observability | `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | §11.1 N 日 close-out evidence canonical path |
| aiworkflow task-workflow-active | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Issue #549 entry の 3 段昇格 |
| aiworkflow indexes | `.claude/skills/aiworkflow-requirements/indexes/{keywords.json, quick-reference.md, resource-map.md, topic-map.md}` | Issue #586 セクション同期済 |
| task-spec lessons | `.claude/skills/task-specification-creator/lessons-learned/n-day-close-out-cross-run-aggregation.md` | cross-run aggregation / Part 1 逐語コピペ運用の lesson |
| task-spec phase-template-phase11 | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | N 日 close-out matrix / cross-run pattern |
| task-spec phase-12 guide | `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md` | N 日 close-out sync 項目 / Part 1 逐語コピペルール |

## User Gate

Production runtime での 7 日観測（hourly run 168 件）・D+7 evidence PR 起票・`pass_runtime_synced` 昇格・親 #549 への runtime evidence 連携・implementation commit / push / PR 作成は明示的なユーザー承認まで保留する。本タスクで投入する境界（workflow YAML 編集 + 新規 / monitor 拡張 / Phase 12 strict 7 files）はローカル PASS のみで運用境界を越えない。`forward-safe rollback` は `gh variable set CF_AUDIT_CLASSIFIER --env production --body "threshold"` の 1 step で実行可能（D1 列削除なし）。

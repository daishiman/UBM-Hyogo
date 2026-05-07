# Phase 12 main / 7 成果物ナビ

| # | Task ID | 成果物 | 状態 |
| --- | --- | --- | --- |
| 1 | Phase 12 本体 | `main.md`（本ファイル） | created |
| 2 | Task 12-1 | `implementation-guide.md`（Part 1 中学生 + Part 2 技術者） | created |
| 3 | Task 12-2 | `system-spec-update-summary.md` | created |
| 4 | Task 12-3 | `documentation-changelog.md` | created |
| 5 | Task 12-4 | `unassigned-task-detection.md`（0 件出力） | created |
| 6 | Task 12-5 | `skill-feedback-report.md`（3 観点固定） | created |
| 7 | Task 12-6 | `phase12-task-spec-compliance-check.md` | created |

## 関連実成果物

- runbook 本体: `docs/runbooks/dlq-monitoring/schema-alias-backfill.md`
- skill 新規 topic: `.claude/skills/aiworkflow-requirements/references/dlq-monitoring.md`
- skill changelog fragment: `.claude/skills/aiworkflow-requirements/changelog/20260507-issue502-dlq-monitoring.md`
- skill indexes / 正本導線: `.claude/skills/aiworkflow-requirements/indexes/{topic-map.md,keywords.json,quick-reference.md,resource-map.md}`、`.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`、`.claude/skills/aiworkflow-requirements/SKILL.md`、`.claude/skills/aiworkflow-requirements/LOGS/_legacy.md`
- 起票元 unassigned task spec trace 追記: `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-dlq-monitoring-dashboard.md` 末尾の「状態遷移」節
- Phase 11 evidence: `outputs/phase-11/{binding-grep.log,repository-grep.log,migration-grep.log,redaction-grep.log,read-only-grep.log,aggregation.md,dash-observation.md}`。実 D1 SQL / dash runtime evidence は user approval 後に取得する。

## メタ

- workflow_state: `spec_created` 維持（root）
- `phases[11].status` は `contract_ready_runtime_pending`、`phases[12].status` は `completed`、`phases[13].status` は `pending_user_approval`
- `metadata.docsOnly = true` / `metadata.github_issue_state = "CLOSED"` 維持
- GitHub Issue #502 は CLOSED 据え置き（reopen / close 二重実行ともに行わない）
- PR 文面は `Refs #502`（`Closes #502` 不可）

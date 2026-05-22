# System Spec Update Summary

Updated canonical specs:

- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `.claude/skills/aiworkflow-requirements/changelog/20260507-issue517-followup-auto-summary.md`
- `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md`
- `.claude/skills/task-specification-creator/LOGS/_legacy.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/keywords.json`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `scripts/post-release-dashboard/README.md`

追加で反映した正本仕様書（Phase-12 監査追補）:

- `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-517-followup-auto-summary-2026-05.md`（lessons-learned 新規）
- `.claude/skills/aiworkflow-requirements/references/workflow-issue-517-followup-auto-summary-foundation-artifact-inventory.md`（artifact inventory 新規）
- `.claude/skills/github-issue-manager/references/scheduled-pr-idempotency.md`（scheduled PR の冪等性ポリシーを正本化）
- `.claude/skills/github-issue-manager/SKILL.md`（Anchors / Trigger / references 表に scheduled-pr-idempotency を追加）
- `docs/30-workflows/unassigned-task/task-issue-517-slack-bootstrap-001.md`（user-gated Slack bootstrap タスクを未タスクとして配置）
- `docs/30-workflows/unassigned-task/task-issue-517-30day-runtime-evidence-001.md`（30 day gate runtime evidence 収集タスクを未タスクとして配置）

Key contract:

- Issue #517 auto-summary uses GitHub Actions + shell scripts for collection, aggregation, draft PR creation, and Slack POST.
- The 30 day gate uses schedule-only runs, requires at least 30 schedule days, and requires `missing_schedule_gap_days = 0`; manual `workflow_dispatch` runs do not affect the gate or failure rate.
- Slack channel construction is a manual preflight: channel `w1618436027-ek2505248`, Incoming Webhook bind, 1Password canonical URL, GitHub Secret `SLACK_WEBHOOK_URL`.
- Slack App / Bot OAuth remains out of scope.

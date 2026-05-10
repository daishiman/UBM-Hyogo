# 2026-05-09 Issue #581 CF Audit 90 Day Re-observation Reminder

## Summary

Issue #581 was added as the canonical Phase 1-13 workflow package for the Issue #546 90 day re-observation reminder.

## Synced Files

- `docs/30-workflows/issue-581-cf-audit-90day-reobservation-reminder/`
- `docs/30-workflows/unassigned-task/issue-546-cf-audit-logs-90day-reobservation-reminder-001.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-issue-546-cf-audit-logs-90day-baseline-observation-artifact-inventory.md`
- `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-546-cf-audit-logs-90day-baseline-observation-2026-05.md`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`

## Notes

- Root `workflow_state` is `spec_created`.
- `observation_continue` is a runtime decision state, not a root workflow state.
- Issue #518 HOLD deleted the watchdog workflow, so Issue #581 records watchdog lifecycle marker evidence instead of querying a non-existent workflow.
- Issue #581 / #546 remain CLOSED; use `Refs #581` / `Refs #546` only.

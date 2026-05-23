# Artifact Inventory: Issue #546 Cloudflare Audit Logs 90 Day Baseline Observation

| Item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/` |
| state | observation_continue / docs-only / NON_VISUAL / Gate-A FAIL / Gate-B-C pending / Issue #546 CLOSED |
| predecessor | Issue #408 (`docs/30-workflows/completed-tasks/issue-408-cf-audit-logs-monitoring/`) and Issue #515 (`docs/30-workflows/completed-tasks/issue-515-cf-audit-logs-ml-anomaly/`) |
| monitor evidence | `outputs/phase-11/gh-run-list-cf-audit-log-monitor.json` (JSON array, 32 failed runs) |
| watchdog evidence | `outputs/phase-11/gh-run-list-watchdog.json` |
| alert issue evidence | `outputs/phase-11/gh-issues-cf-audit.json` |
| D1 evidence | `outputs/phase-11/d1-cf-audit-90day-summary.json` (`no such table: cf_audit_log`) |
| baseline evidence | `outputs/phase-11/baseline-90day-thresholds.json` (`PENDING_RUNTIME_EVIDENCE`) |
| tuning evidence | `outputs/phase-11/tuning-cost-summary.md`, `outputs/phase-11/tuning-cost-issues.json` |
| gate decision | `outputs/phase-11/gate-decision.md` |
| SSOT — observability | `references/observability-monitoring.md` §11 Issue #546 |
| SSOT — D1 store | `references/database-schema-cf-audit-log.md` |
| SSOT — runbook | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` Issue #546 section |
| SSOT — workflow | `references/task-workflow-active.md` Issue #546 row |
| lessons-learned | `references/lessons-learned-issue-546-cf-audit-logs-90day-baseline-observation-2026-05.md` |
| Phase 12 strict 7 | `outputs/phase-12/{main,implementation-guide,documentation-changelog,unassigned-task-detection,skill-feedback-report,system-spec-update-summary,phase12-task-spec-compliance-check}.md` |
| re-observation reminder | `docs/30-workflows/issue-581-cf-audit-90day-reobservation-reminder/` |
| re-observation root artifacts | `docs/30-workflows/issue-581-cf-audit-90day-reobservation-reminder/artifacts.json`, `outputs/artifacts.json` |
| re-observation Phase 12 strict 7 | `docs/30-workflows/issue-581-cf-audit-90day-reobservation-reminder/outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` |
| re-observation pointer | `docs/30-workflows/unassigned-task/issue-546-cf-audit-logs-90day-reobservation-reminder-001.md` |

## Gate Result

| Gate | Result | Evidence boundary |
| --- | --- | --- |
| Gate-A 90 day continuity | FAIL | only 32 failed monitor runs and 32 failed watchdog runs from 2026-05-06 to 2026-05-07 |
| Gate-B FPR <= 5% | PENDING | alert issue count is 0, but D1 table readiness and baseline thresholds are unavailable |
| Gate-C tuning cost >= 4h/month | PENDING | no owner-authored monthly tuning minutes log |

Decision: `observation_continue`. Do not proceed to ML comparison or production ML switch from this evidence set.

## Re-observation Reminder Package (Issue #581)

Issue #581 formalizes the next 90 day observation cycle as `docs/30-workflows/issue-581-cf-audit-90day-reobservation-reminder/`.

| Item | Value |
| --- | --- |
| root state | `spec_created` |
| runtime decision state | `observation_continue` |
| earliest execution | 2026-08-05, or 90 days after the first successful monitor run, whichever is later |
| closed issue handling | Issue #581 / #546 stay CLOSED; use `Refs #581` / `Refs #546` only |
| watchdog handling | Issue #518 HOLD deleted the watchdog workflow; store lifecycle marker JSON instead of querying a non-existent workflow |

# workflow-issue-655-d7-recovery-2nd-cycle artifact inventory

| 種別 | path | 状態 |
| --- | --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-655-d7-recovery-2nd-cycle/` | implemented-local-runtime-pending / implementation / NON_VISUAL |
| root index | `docs/30-workflows/completed-tasks/issue-655-d7-recovery-2nd-cycle/index.md` | workflow meta and PR-A/PR-B split |
| root artifacts | `docs/30-workflows/completed-tasks/issue-655-d7-recovery-2nd-cycle/artifacts.json` | metadata ledger |
| output artifacts | `docs/30-workflows/completed-tasks/issue-655-d7-recovery-2nd-cycle/outputs/artifacts.json` | parity marker |
| Phase specs | `docs/30-workflows/completed-tasks/issue-655-d7-recovery-2nd-cycle/phase-01.md` ... `phase-13.md` | spec contract |
| Phase 11 index | `docs/30-workflows/completed-tasks/issue-655-d7-recovery-2nd-cycle/outputs/phase-11/main.md` | runtime boundary |
| Phase 11 manifest | `docs/30-workflows/completed-tasks/issue-655-d7-recovery-2nd-cycle/outputs/phase-11/canonical-paths.json` | planned evidence manifest |
| Phase 11 local evidence | `docs/30-workflows/completed-tasks/issue-655-d7-recovery-2nd-cycle/outputs/phase-11/evidence/local-verify.log` | captured |
| Phase 11 templates | `docs/30-workflows/completed-tasks/issue-655-d7-recovery-2nd-cycle/outputs/phase-11/evidence/*.RUNTIME_PENDING_USER_APPROVAL.md` | runtime pending |
| Phase 12 strict 7 | `docs/30-workflows/completed-tasks/issue-655-d7-recovery-2nd-cycle/outputs/phase-12/*.md` | materialized |
| parent workflow | `docs/30-workflows/completed-tasks/issue-586-post-switch-7day-close-out/` | historical parent |
| target workflow | `.github/workflows/cf-audit-log-7day-summary.yml` | PR-A implementation target |
| target helper | `scripts/cf-audit-log/observation/post-switch-monitor.ts` | PR-A implementation target |
| target runbook | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | PR-A implementation target |
| aiworkflow observability | `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | same-wave sync |
| aiworkflow active ledger | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | same-wave sync |

## User Gate

Runtime `gh run list`, `gh workflow run`, D'+7 aggregation, commit, push, PR
creation, secret/variable mutation, production deploy, and `pass_runtime_synced`
promotion require explicit user approval.

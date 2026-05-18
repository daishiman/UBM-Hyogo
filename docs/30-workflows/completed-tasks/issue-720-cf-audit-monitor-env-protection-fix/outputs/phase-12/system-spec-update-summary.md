# System spec update summary

| Target | Change | Status |
| --- | --- | --- |
| `.github/workflows/cf-audit-log-monitor.yml` | Removed `environment: production` from the read-only monitor job | Applied locally |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | Added monitoring-vs-deploy environment separation rule | Applied locally |
| Repository secrets | Mirror five monitor secrets at repository level | Pending user gate |
| Repository variables | Mirror nine monitor variables at repository level | Pending user gate |
| Production environment protection | No branch policy, reviewer, or wait-timer change | Unchanged |
| Parent recovery workflow | Path corrected to `docs/30-workflows/completed-tasks/issue-655-d7-recovery-2nd-cycle/`; runtime prerequisite remains pending until post-merge success evidence | Pending runtime evidence |
| aiworkflow-requirements indexes | Issue #720 workflow and parent path correction registered | Applied locally |
| task-specification-creator skill | Read-only monitor environment gate and Phase 11 placeholder evidence rule promoted | Applied locally |

No API, D1 schema, app route, or UI contract is changed.

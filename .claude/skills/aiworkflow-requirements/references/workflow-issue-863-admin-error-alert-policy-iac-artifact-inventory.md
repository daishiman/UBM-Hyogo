# workflow-issue-863-admin-error-alert-policy-iac artifact inventory

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-863-admin-error-alert-policy-iac/` |
| root artifacts | `docs/30-workflows/completed-tasks/issue-863-admin-error-alert-policy-iac/artifacts.json` |
| output artifacts | `docs/30-workflows/completed-tasks/issue-863-admin-error-alert-policy-iac/outputs/artifacts.json` |
| index | `docs/30-workflows/completed-tasks/issue-863-admin-error-alert-policy-iac/index.md` |
| Phase 11 evidence | `docs/30-workflows/completed-tasks/issue-863-admin-error-alert-policy-iac/outputs/phase-11/manual-test-result.md` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/issue-863-admin-error-alert-policy-iac/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| logger implementation | `apps/web/src/lib/logger.ts` |
| logger tests | `apps/web/src/lib/__tests__/logger.spec.ts` |
| Sentry alert IaC | `infra/sentry-alerts/` |
| Sentry drift CI | `.github/workflows/sentry-alerts-drift.yml` |
| runbook | `docs/30-workflows/runbooks/issue-863-admin-error-boundary-alert-response.md` |
| source consumed task | `docs/30-workflows/unassigned-task/fix-admin-scr-err-stg-followup-002-admin-runtime-sentry-alert-policy.md` |

## Contract

The workflow is `implemented_local_runtime_pending / implementation / NON_VISUAL`.
Local implementation promotes `scope` and `digest` from logger payload into Sentry tags, adds declarative Sentry alert policy IaC, drift detection, CODEOWNERS ownership, package scripts, and an incident response runbook.
Sentry API apply, staging Slack notification smoke, commit, push, and PR remain user-gated.

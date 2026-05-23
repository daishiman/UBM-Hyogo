# Artifact Inventory - Issue #290 workflow lint gate

## Metadata

| Field | Value |
| --- | --- |
| task ID | `issue-290-workflow-lint-gate` |
| task type | implementation / NON_VISUAL |
| canonical task root | `docs/30-workflows/completed-tasks/issue-290-workflow-lint-gate/` |
| state | `implemented_local_evidence_captured / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / Phase 13 pending_user_approval` |
| Issue | #290 |
| parent | UT-CICD-DRIFT |
| source task | `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-workflow-lint-gate.md` consumed |

## Current facts

| Field | Canonical |
| --- | --- |
| CI owner | `.github/workflows/ci.yml` |
| dedicated job | `workflow-shell-lint` |
| local reproduction | `pnpm observation:lint` |
| actionlint version | `1.7.7` |
| lint target | `.github/workflows/*.yml` |
| workflow count | 32 `.yml` files |
| yamllint | not adopted |
| runbook | `docs/30-workflows/runbooks/workflow-lint-local-recovery.md` |

## Same-cycle shellcheck cleanup

The first all-workflows actionlint run surfaced existing shellcheck issues. The following workflow snippets were minimally corrected so the gate is real, not paper-only:

- `.github/workflows/cf-audit-log-7day-summary.yml`
- `.github/workflows/cf-audit-log-monitor.yml`
- `.github/workflows/cf-token-rotation-reminder.yml`
- `.github/workflows/lighthouse.yml`
- `.github/workflows/release-create.yml`
- `.github/workflows/validate-build.yml`

## Phase outputs

| Phase | Artifact |
| --- | --- |
| 1 | `outputs/phase-01/current-coverage.md` |
| 2 | `outputs/phase-02/yamllint-decision.md` |
| 8 | `outputs/phase-08/static-check-log.md` |
| 10 | `outputs/phase-10/go-no-go.md` |
| 11 | `outputs/phase-11/smoke-log.md` |
| 12 | `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` |

## Runtime boundary

Commit, push, PR creation, GitHub Actions runtime evidence, and branch protection required-context changes are user-gated.

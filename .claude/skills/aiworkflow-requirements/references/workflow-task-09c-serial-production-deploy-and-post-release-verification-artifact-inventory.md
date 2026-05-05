# 09c Production Deploy and Post-Release Verification Artifact Inventory

Status: docs-only / spec_created / VISUAL / runtime evidence pending_user_approval

## Canonical Roots

| Kind | Path |
| --- | --- |
| Current workflow root | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/` |
| Legacy workflow root | `docs/30-workflows/02-application-implementation/09c-serial-production-deploy-and-post-release-verification/` |
| Runtime execution follow-up | `docs/30-workflows/unassigned-task/task-09c-production-deploy-execution-001.md` |

## Phase Artifacts

| Phase | Required artifact |
| --- | --- |
| 1-13 | `phase-01.md` ... `phase-13.md` |
| root metadata | `index.md`, `artifacts.json` |
| output metadata | `outputs/artifacts.json` |
| Phase 11 templates | `outputs/phase-11/{main,production-smoke-runbook,release-tag-evidence,share-evidence,post-release-24h-evidence,sync-jobs-production,manual-test-checklist,manual-test-result,discovered-issues}.md`, `outputs/phase-11/screenshot-plan.json`, `outputs/phase-11/screenshots/pending-runtime-evidence.png` |
| Phase 12 required set | `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` |
| Phase 12 extra summary | `outputs/phase-12/post-release-summary.md` |
| Phase 13 handoff | `outputs/phase-13/{main,pr-body}.md` |

## Boundary

09c fixes the production deploy runbook and evidence template only. It does not assert production runtime PASS, run Cloudflare deploy commands, push a release tag, collect 24h metrics, or open a PR. Runtime execution remains blocked until explicit user approval and is tracked by `task-09c-production-deploy-execution-001.md`.

## Formalized Follow-Ups

| Task | Purpose |
| --- | --- |
| `task-09c-production-deploy-execution-001.md` | Execute production deploy after approval |
| `task-09c-post-release-dashboard-automation-001.md` | Automate 24h dashboard verification |
| `task-09c-github-release-tag-automation-001.md` | Automate GitHub Release creation |
| `task-09c-incident-runbook-slack-delivery-001.md` | Automate Slack delivery for incident runbook |
| `task-09c-long-term-production-observation-001.md` | 1-week / 1-month production trend review |
| `task-09c-cloudflare-analytics-export-001.md` | Long-term Cloudflare Analytics export |
| `task-09c-postmortem-template-automation-001.md` | Automate postmortem templates |
| `task-08a-canonical-workflow-tree-restore-001.md` | Restore or reclassify missing 08a canonical workflow tree |

## Verification

```bash
diff -u docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/artifacts.json docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/artifacts.json
find docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12 -maxdepth 1 -type f | sort
rg -n '09c-serial-production-deploy-and-post-release-verification|task-09c-production-deploy-execution-001' .claude/skills/aiworkflow-requirements docs/30-workflows
```

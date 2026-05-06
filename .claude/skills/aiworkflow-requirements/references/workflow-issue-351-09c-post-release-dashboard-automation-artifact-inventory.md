# workflow-issue-351-09c-post-release-dashboard-automation artifact inventory

| 種別 | path | 状態 |
| --- | --- | --- |
| workflow root | `docs/30-workflows/issue-351-09c-post-release-dashboard-automation/` | spec_created / implementation / NON_VISUAL |
| root artifacts | `docs/30-workflows/issue-351-09c-post-release-dashboard-automation/artifacts.json` | root / outputs parity required |
| outputs artifacts | `docs/30-workflows/issue-351-09c-post-release-dashboard-automation/outputs/artifacts.json` | root と同期 |
| Phase 11 evidence | `docs/30-workflows/issue-351-09c-post-release-dashboard-automation/outputs/phase-11/` | structure / grep / dataset discover / dry-run / redaction / schema check |
| Phase 12 strict files | `docs/30-workflows/issue-351-09c-post-release-dashboard-automation/outputs/phase-12/` | implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / compliance check |
| GitHub Actions implementation | `.github/workflows/post-release-dashboard.yml` | follow-up implementation target |
| collector implementation | `scripts/post-release-dashboard/` | follow-up implementation target |
| Cloudflare API wrapper | `scripts/cf.sh api-post /client/v4/graphql -d <json>` | implemented wrapper boundary |
| aiworkflow GHA spec | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | post-release dashboard section |
| aiworkflow Cloudflare spec | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md` | analytics read-only token separation |
| changelog | `.claude/skills/aiworkflow-requirements/changelog/20260505-issue351-post-release-dashboard.md` | sync record |

## User Gate

Commit / push / PR / real `workflow_dispatch` / schedule evidence collection are blocked until explicit user approval.

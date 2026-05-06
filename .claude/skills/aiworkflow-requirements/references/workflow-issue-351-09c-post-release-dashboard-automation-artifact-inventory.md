# workflow-issue-351-09c-post-release-dashboard-automation artifact inventory

| 種別 | path | 状態 |
| --- | --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-351-09c-post-release-dashboard-automation/` | spec_created / implementation / NON_VISUAL |
| root artifacts | `docs/30-workflows/completed-tasks/issue-351-09c-post-release-dashboard-automation/artifacts.json` | root / outputs parity required |
| outputs artifacts | `docs/30-workflows/completed-tasks/issue-351-09c-post-release-dashboard-automation/outputs/artifacts.json` | root と同期 |
| Phase 11 evidence | `docs/30-workflows/completed-tasks/issue-351-09c-post-release-dashboard-automation/outputs/phase-11/` | structure / grep / dataset discover / dry-run / redaction / schema check |
| Phase 12 strict files | `docs/30-workflows/completed-tasks/issue-351-09c-post-release-dashboard-automation/outputs/phase-12/` | implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / compliance check |
| GitHub Actions implementation | `.github/workflows/post-release-dashboard.yml` | follow-up implementation target |
| collector implementation | `scripts/post-release-dashboard/` | follow-up implementation target |
| Cloudflare API wrapper | `scripts/cf.sh api-post /client/v4/graphql -d <json>` | implemented wrapper boundary |
| aiworkflow GHA spec | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | post-release dashboard section |
| aiworkflow Cloudflare spec | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md` | analytics read-only token separation |
| changelog | `.claude/skills/aiworkflow-requirements/changelog/20260505-issue351-post-release-dashboard.md` | sync record |
| follow-up workflow | `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/` | Issue #497 30 day conclusion follow-up（spec_created / docs-only / NON_VISUAL / external-time-dependent / 30 day gate pending） |
| follow-up changelog | `.claude/skills/aiworkflow-requirements/changelog/20260506-issue497-30day-feedback.md` | formalized contract record（Issue #497） |
| follow-up lessons | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-497-post-release-dashboard-30day-conclusion-2026-05.md` | L-497-001..004（外部時間依存の二相状態 / file-existence と runtime AC 分離 / 親契約 hardening 同サイクル / 3-fence detection model） |
| same-cycle hardening | `scripts/post-release-dashboard/lib/redaction-check.sh`, `scripts/post-release-dashboard/__tests__/redaction-check.test.sh`, `.github/workflows/ci.yml` | redaction-check.md artifact 出力 + CI に `pnpm post-release-dashboard:test` 追加 |

## User Gate

Commit / push / PR / real `workflow_dispatch` / schedule evidence collection are blocked until explicit user approval.

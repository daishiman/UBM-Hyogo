# Phase 12 Documentation Changelog

state: implemented-local
workflow_id: issue-351-09c-post-release-dashboard-automation

| 種別 | path | 反映内容 |
| --- | --- | --- |
| workflow | `.github/workflows/post-release-dashboard.yml` | post-release dashboard の daily schedule / manual dispatch / artifact upload を追加 |
| collector | `scripts/post-release-dashboard/collect.sh` | dashboard collector entrypoint を追加 |
| collector lib | `scripts/post-release-dashboard/lib/cf-graphql.sh` | Workers requests / errors GraphQL collector を追加 |
| collector lib | `scripts/post-release-dashboard/lib/d1-metrics.sh` | D1 reads / writes GraphQL collector を追加 |
| collector lib | `scripts/post-release-dashboard/lib/cron-status.sh` | latest schedule status collector を追加 |
| collector lib | `scripts/post-release-dashboard/lib/format-dashboard.sh` | dashboard JSON / Markdown formatter を追加 |
| collector lib | `scripts/post-release-dashboard/lib/redaction-check.sh` | artifact redaction gate を追加 |
| tests | `scripts/post-release-dashboard/__tests__/` | fixture-based schema / judgment / redaction tests を追加 |
| package script | `package.json` | `post-release-dashboard:test` を追加 |
| gitignore | `.gitignore` | `outputs/post-release-dashboard/**` を ignore |
| wrapper | `scripts/cf.sh` | `api-post /client/v4/graphql` 専用境界に補正 |
| aiworkflow reference | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | GitHub Actions 正本を同期 |
| aiworkflow reference | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md` | analytics read-only token 分離を同期 |
| aiworkflow reference | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Issue #351 workflow を active に登録 |
| aiworkflow inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-351-09c-post-release-dashboard-automation-artifact-inventory.md` | artifact inventory を追加 |
| aiworkflow changelog | `.claude/skills/aiworkflow-requirements/changelog/20260505-issue351-post-release-dashboard.md` | 同期履歴を追加 |
| workflow docs | `docs/30-workflows/issue-351-09c-post-release-dashboard-automation/` | Phase 12 outputs を実体化し、state を implemented-local に補正 |
| source unassigned | `docs/30-workflows/unassigned-task/task-09c-post-release-dashboard-automation-001.md` | `formalized` stub に更新 |

## 未実行の運用

commit / push / PR / real `workflow_dispatch` / schedule run はユーザー承認まで実行していない。

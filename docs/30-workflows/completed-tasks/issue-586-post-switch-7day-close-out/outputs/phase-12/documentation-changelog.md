# Documentation Changelog

| path | change-summary | wave |
| --- | --- | --- |
| `.github/workflows/cf-audit-log-monitor.yml` | HOLD 解除 + hourly schedule + 3 post-step + artifact upload | same-wave |
| `.github/workflows/cf-audit-log-7day-summary.yml` | 新規（168 hourly snapshots aggregation） | same-wave |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | §11.1 contract + 変更履歴 1 行 | same-wave |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Issue #549 entry を 3 段昇格仕様で更新 | same-wave |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | Issue #586 close-out section 追加 | same-wave |
| `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-13.md` | 2026-05-09 update 注記追加 | same-wave |
| `docs/30-workflows/runbooks/cf-audit-logs-weekly-manual-check.md` | HOLD 解除を反映 | same-wave |
| `docs/30-workflows/issue-586-post-switch-7day-close-out/index.md` | 仕様書 root（spec_created） | same-wave |
| `docs/30-workflows/issue-586-post-switch-7day-close-out/phase-{01..13}.md` | Phase 仕様書 13 本 | same-wave |
| `docs/30-workflows/issue-586-post-switch-7day-close-out/outputs/phase-{01..10,12}/main.md` | Phase outputs 11 本 | same-wave |
| `docs/30-workflows/issue-586-post-switch-7day-close-out/outputs/phase-11/{main,manual-smoke-log,link-checklist}.md` | Phase 11 NON_VISUAL 縮約 3 点 | same-wave |
| `docs/30-workflows/issue-586-post-switch-7day-close-out/outputs/phase-11/evidence/{typecheck,lint,test,build,grep-gate}.log` | local 5 evidence | same-wave |
| `docs/30-workflows/issue-586-post-switch-7day-close-out/outputs/phase-12/{implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` | strict 7 outputs (本ファイル含む) | same-wave |
| `docs/30-workflows/issue-586-post-switch-7day-close-out/outputs/phase-11/evidence/{hourly-run-7day.md,hourly-run-7day-summary.json,leakage-grep-7day.log,issue-rate-comparison.md}` | D+7 evidence 4 点 | D+7 |
| `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | N日 close-out evidence matrix / cross-run artifact aggregation / false-green gate を追加 | same-wave review fix |
| `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md` | Phase 12 の N日 close-out sync 必須項目を追加 | same-wave review fix |
| `.claude/skills/{aiworkflow-requirements,task-specification-creator}/LOGS/_legacy.md` | Issue #586 review feedback 追記 | same-wave review fix |

topic-map / quick-reference / resource-map: 既存 Issue #549/#586 正本行で導線あり。新規見出し番号再生成は不要（本文構造変更なし）。

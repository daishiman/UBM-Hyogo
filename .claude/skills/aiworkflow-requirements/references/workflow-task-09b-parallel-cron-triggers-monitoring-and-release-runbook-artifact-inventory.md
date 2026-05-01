# 09b Cron Monitoring / Release Runbook Artifact Inventory

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | 09b-parallel-cron-triggers-monitoring-and-release-runbook |
| タスク種別 | docs-only / `spec_created` / `NON_VISUAL` |
| canonical task root | `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/` |
| close-out 日 | 2026-05-01 |
| 状態 | Phase 1-12 completed as specification / Phase 13 blocked until explicit user approval |
| 実測境界 | runtime cron 変更、deploy、rollback、Dashboard 操作は未実行 |
| blocks | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/` |

## Current Facts

| 項目 | 正本 |
| --- | --- |
| cron current facts | `apps/api/wrangler.toml` の `0 * * * *`, `0 18 * * *`, `*/15 * * * *` |
| legacy hourly cron | `0 * * * *` は UT21-U05 で撤回・runtime 整理する |
| Phase 11 evidence | NON_VISUAL。`main.md`, `manual-smoke-log.md`, `link-checklist.md` |
| Phase 12 mandatory artifacts | skill 必須 7 ファイル + 09b 固有 runbook 3 ファイル |
| Phase 13 gate | commit / push / PR は user approval まで禁止 |

## Phase Outputs

| Phase | 場所 | 主要成果物 |
| --- | --- | --- |
| 1-10 | `outputs/phase-01/` 〜 `outputs/phase-10/` | 要件 / cron schedule design / verify suite / deployment runbook / rollback / AC matrix / GO-NO-GO |
| 11 | `outputs/phase-11/` | `main.md`, `manual-smoke-log.md`, `link-checklist.md` |
| 12 | `outputs/phase-12/` | `main.md`, `implementation-guide.md`, `system-spec-update-summary.md`, `documentation-changelog.md`, `unassigned-task-detection.md`, `skill-feedback-report.md`, `phase12-task-spec-compliance-check.md`, `release-runbook.md`, `incident-response-runbook.md`, `runbook-diff-plan.md` |
| 13 | `outputs/phase-13/` | `main.md`, `local-check-result.md`, `change-summary.md`, `pr-info.md`, `pr-creation-result.md` placeholders |

## Skill 反映先

| ファイル | 反映内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | 09b sync wave の変更履歴 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | canonical task root、current status、artifact inventory / lessons 導線 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 09b runbook 早見 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow 状態と 09a / 09c handoff |
| `.claude/skills/aiworkflow-requirements/references/deployment-details.md` | API Worker cron current facts と legacy hourly cron 境界 |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | 09b incident severity と sync monitoring linkage |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned-09b-cron-monitoring-release-runbook-2026-05.md` | 09b 苦戦箇所 |
| `.claude/skills/task-specification-creator/references/phase12-skill-feedback-promotion.md` | 09b の skill feedback promotion routing 事例 |
| `.claude/skills/skill-creator/references/patterns-success-skill-phase12.md` | 09b の Phase 12 promotion success pattern |

## Follow-up / Unassigned

| 状態 | task |
| --- | --- |
| formalized | `docs/30-workflows/unassigned-task/task-obs-sentry-dsn-registration-001.md` |
| formalized | `docs/30-workflows/unassigned-task/task-obs-slack-notify-001.md` |
| formalized | `docs/30-workflows/unassigned-task/task-db-syncjobs-unique-001.md` |
| delegated | `docs/30-workflows/unassigned-task/task-ut21-impl-path-boundary-realignment-001.md` |
| delegated | `docs/30-workflows/unassigned-task/ut-05a-cf-analytics-auto-check-001.md` |
| existing related | `docs/30-workflows/unassigned-task/task-09c-postmortem-template-automation-001.md` |
| existing related | `docs/30-workflows/unassigned-task/task-09c-github-release-tag-automation-001.md` |

## Validation Chain

| 検証 | 期待 |
| --- | --- |
| `cmp artifacts.json outputs/artifacts.json` | root/output parity 0 diff |
| `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook` | Phase 12 artifacts と parity が PASS |
| `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` | `topic-map.md` / `keywords.json` 更新 |
| `node .claude/skills/aiworkflow-requirements/scripts/validate-structure.js` | aiworkflow-requirements structure PASS |
| mirror sync + `diff -qr` | 実在する `.agents/skills/<skill>` mirror と差分なし |

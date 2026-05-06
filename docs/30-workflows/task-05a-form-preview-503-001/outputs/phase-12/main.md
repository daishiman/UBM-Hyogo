# Phase 12 main — documentation update index

## strict 7 files inventory

| # | ファイル | 役割 | 状態 |
| --- | --- | --- | --- |
| 1 | `main.md` | 本 index | present |
| 2 | `implementation-guide.md` | Part 1 / Part 2 implementation guide + runbook | present |
| 3 | `system-spec-update-summary.md` | aiworkflow-requirements same-wave sync summary | present |
| 4 | `documentation-changelog.md` | documentation changelog | present |
| 5 | `unassigned-task-detection.md` | unassigned task detection report | present |
| 6 | `skill-feedback-report.md` | skill feedback routing | present |
| 7 | `phase12-task-spec-compliance-check.md` | root compliance evidence | present |

補助 ledger:

- `outputs/artifacts.json`: root `artifacts.json` と同一内容の parity copy。

## 状態境界

本 workflow は `implemented-local-runtime-evidence-blocked / implementation / NON_VISUAL`。Phase 12 成果物は contract completeness と local code/test evidence を示すが、Phase 11 runtime evidence は user-approved operation cycle まで `BLOCKED_PENDING_RUNTIME_EVIDENCE` のまま維持する。

## same-wave sync

aiworkflow-requirements への同期先:

- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-task-05a-form-preview-503-001-artifact-inventory.md`
- `.claude/skills/aiworkflow-requirements/references/lessons-learned-05a-form-preview-503-2026-05.md`
- `.claude/skills/aiworkflow-requirements/changelog/20260505-task-05a-form-preview-503.md`

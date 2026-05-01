# Phase 12 Documentation Changelog

## Changed Files

| File | Change |
| --- | --- |
| `phase-01.md` - `phase-13.md` | 重複テンプレートを Phase 固有の仕様へ再構成 |
| `artifacts.json` | `visualEvidence`, `taskType`, Phase 13 approval gate, Phase 12 artifact list を追加 |
| `outputs/phase-12/implementation-guide.md` | Phase 12 Task 1 追加 |
| `outputs/phase-12/system-spec-update-summary.md` | Phase 12 Task 2 追加 |
| `outputs/phase-12/documentation-changelog.md` | Phase 12 Task 3 追加 |
| `outputs/phase-12/unassigned-task-detection.md` | Phase 12 Task 4 追加 |
| `outputs/phase-12/skill-feedback-report.md` | Phase 12 Task 5 追加 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 Task 6 追加 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | conflict marker 解消と 05b-B 導線追加 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 05b-B 導線追加 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 05b-B workflow 行追加 |
| `.claude/skills/aiworkflow-requirements/references/legacy-ordinal-family-register.md` | 05b-B path drift mapping 追加 |
| `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | 05b-B callback route / Credentials Provider contract 追加 |
| `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | Auth.js callback route 導入後の env 境界へ更新 |
| `docs/30-workflows/05b-B-magic-link-callback-credentials-provider/artifacts.json` / `outputs/artifacts.json` | `implemented-local / implementation / NON_VISUAL` に同期 |

## Validator / Checks

検証は `phase12-task-spec-compliance-check.md` に集約する。local runtime evidence は typecheck / focused tests / boundary check で取得済み。dev-server curl / staging smoke は 09a 系 runtime evidence に委譲する。

## Canonical Names

Phase 12 canonical filenames are:

- `main.md`
- `implementation-guide.md`
- `system-spec-update-summary.md`
- `documentation-changelog.md`
- `unassigned-task-detection.md`
- `skill-feedback-report.md`
- `phase12-task-spec-compliance-check.md`

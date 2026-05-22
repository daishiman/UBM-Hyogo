# Documentation Changelog

## Updated Workflow Files

- `index.md`: state moved to `implemented_local_runtime_pending`.
- `artifacts.json` and `outputs/artifacts.json`: phase status and workflow state synchronized.
- `phase-01.md`: required metadata table and artifacts metadata confirmation added.
- `phase-11.md`: canonical `## 4. Phase 11 evidence file inventory` with present/pending statuses.
- `phase-12.md`: strict 7 outputs listed.
- `specs/spec-01..04.md`: current code topology aligned.

## Added Evidence

- `outputs/phase-07/test.log`
- `outputs/phase-07/api-typecheck.log`
- `outputs/phase-07/smoke-test.log`
- `outputs/phase-07/cfsh-secret-put.log`
- `outputs/phase-07/typecheck.log` records unrelated workspace typecheck blocker in `apps/web`.
- `outputs/phase-11/evidence/staging-runtime-smoke.log` + `staging-runtime-smoke-summary.json`: AUTH_SECRET re-injection 後の staging で admin-list / admin-detail / admin-attendance / me-root / me-profile / me-attendance 全 6 経路が HTTP 200 PASS。`phase-11.md` の対応行を pending → present に昇格。

## Skill / System Sync

- `task-specification-creator` Phase 1 core guidance, SKILL entry, and changelog updated.
- `aiworkflow-requirements` quick-reference, resource-map, task-workflow-active, artifact inventory, changelog, lessons learned, and lessons hub updated.

## Notes on Phase 11 Layout (NON_VISUAL)

- `outputs/phase-11/` ディレクトリは構造保持のため作成しているが中身は空。本タスクは `visualEvidence: NON_VISUAL` のため screenshot/visual artifact は存在せず、Phase 11 evidence は `outputs/phase-07/` 配下（typecheck/lint/test/smoke log）に統合している。`phase-11.md` の evidence inventory がこの分離を明示する正本。


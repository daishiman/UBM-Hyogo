# documentation-changelog.md

## 2026-04-29 — UT-GOV-004 close-out

### Added (新規ファイル)

- `outputs/phase-01/main.md`
- `outputs/phase-02/{context-name-mapping.md, staged-rollout-plan.md, lefthook-ci-correspondence.md}`
- `outputs/phase-03/main.md`
- `outputs/phase-04/test-strategy.md`
- `outputs/phase-05/{implementation-runbook.md, workflow-job-inventory.md, required-contexts-final.md, lefthook-ci-mapping.md, staged-rollout-plan.md, strict-mode-decision.md}`
- `outputs/phase-06/failure-cases.md`
- `outputs/phase-07/ac-matrix.md`
- `outputs/phase-08/{main.md, confirmed-contexts.yml, lefthook-ci-mapping.md}`
- `outputs/phase-09/{main.md, strict-decision.md}`
- `outputs/phase-10/go-no-go.md`
- `outputs/phase-11/{main.md, manual-smoke-log.md, link-checklist.md}`
- `outputs/phase-12/{implementation-guide.md, system-spec-update-summary.md, documentation-changelog.md, unassigned-task-detection.md, skill-feedback-report.md, phase12-task-spec-compliance-check.md, elegant-final-verification.md}`
- `outputs/phase-13/main.md`
- `outputs/artifacts.json`
- 仕様 phase-01.md 〜 phase-13.md / index.md / artifacts.json

### Changed (既存修正)

- `outputs/phase-08/confirmed-contexts.yml`: `source_sha` と検証コマンドを固定 SHA に更新し、schema version を明示
- `outputs/phase-07/ac-matrix.md`: 草案 8 contexts の最終処遇表を Phase 2 / Phase 8 / Phase 12 と同期
- `outputs/phase-11/{main.md, manual-smoke-log.md, link-checklist.md}`: NON_VISUAL evidence の状態を pending から text-only handoff / recorded へ補正
- `outputs/phase-12/{implementation-guide.md, system-spec-update-summary.md, phase12-task-spec-compliance-check.md, unassigned-task-detection.md}`: Phase 12 仕様準拠と引き渡し境界を補正
- `docs/30-workflows/LOGS.md`
- `.claude/skills/task-specification-creator/LOGS/_legacy.md`
- `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md`

### Removed

- なし

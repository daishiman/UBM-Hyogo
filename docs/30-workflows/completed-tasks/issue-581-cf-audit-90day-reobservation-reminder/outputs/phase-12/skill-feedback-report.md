# Skill Feedback Report

## Template Improvements

- Phase 12 strict 7 filenames must remain `main.md`, `implementation-guide.md`, `system-spec-update-summary.md`, `documentation-changelog.md`, `unassigned-task-detection.md`, `skill-feedback-report.md`, and `phase12-task-spec-compliance-check.md`.
- Long-running observation workflows need an explicit distinction between root `workflow_state` and domain decision values such as `observation_continue`.

## Workflow Improvements

- Deleted or HOLDed workflow files should be captured as lifecycle marker JSON, not queried as live GitHub workflow APIs.
- P-1 date gate can stop runtime execution; P-2 run success insufficiency should normally be recorded as Gate-A FAIL, not block Gate-A evidence creation.
- Promotion completed: `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md` now documents HOLD / deleted workflow lifecycle marker objects and P-1 early termination minimum evidence.
- Promotion completed: `.claude/skills/task-specification-creator/SKILL-changelog.md` records `v2026.05.09-issue581-hold-lifecycle-marker`.

## Documentation Improvements

- Existing unassigned reminders promoted to full workflow packages should be converted into pointers to prevent duplicate observation loops.
- Closed issue handling should remain `Refs`-only in the workflow root, Phase 11 decision, and Phase 13 approval text.

## Promotion Routing

| Feedback | Routing | Evidence |
| --- | --- | --- |
| HOLDed / deleted workflow evidence must not be modeled as live run history | promoted | `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md` |
| P-1 early termination must not fabricate runtime strict evidence | promoted | `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md` |
| Root workflow state and domain decision state must remain separate | no-op: already covered by `workflow-state-vocabulary.md` and this workflow's artifacts metadata | `artifacts.json`, `outputs/artifacts.json` |
| Phase 12 strict 7 filenames remain canonical | no-op: existing Phase 12 guide already defines strict 7; this workflow records compliance evidence | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

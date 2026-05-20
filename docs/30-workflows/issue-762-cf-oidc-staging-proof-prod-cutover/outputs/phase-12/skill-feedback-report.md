# Skill Feedback Report

## Template Improvements

- Phase 12 custom domain outputs are useful, but they must not replace canonical strict 7 names. This workflow keeps `secrets-boundary-current.md`, `future-oidc-supported-path.md`, `claim-pin-verifier-spec.md`, `redaction-pattern-update.md`, and `observation-window-runbook.md` as supplemental files while restoring `main.md`, `system-spec-update-summary.md`, `documentation-changelog.md`, `skill-feedback-report.md`, and `phase12-task-spec-compliance-check.md`.

## Workflow Improvements

- Implementation workflows must update `implementation_status` in `artifacts.json` after real files land. `spec_created_pending_implementation` is not acceptable once `scripts/`, `.github/workflows/`, or requirements references are changed.

## Documentation Improvements

- Source unassigned tasks should record partial consumption explicitly when a workflow implements only pre-support hardening while leaving the real runtime cutover blocked.

No task-specification-creator or aiworkflow-requirements SKILL.md change is required; existing rules already cover the detected gaps.

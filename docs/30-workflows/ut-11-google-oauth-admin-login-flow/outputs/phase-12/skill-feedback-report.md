# Phase 12 Skill Feedback Report

## Workflow Improvement

`artifacts.json` should be validated immediately after phase generation so declared output files cannot drift from files on disk.

## Technical Lesson

OAuth specs need an explicit safe redirect contract. PKCE and state validation are not enough if `next` can be attacker-controlled.

## Skill Improvement Proposal

Add a task-specification-creator validation rule:

- every `artifacts.json.phases[].outputs[]` path must exist
- Phase 12 must include `implementation-guide.md`, `system-spec-update-summary.md`, `documentation-changelog.md`, `unassigned-task-detection.md`, `skill-feedback-report.md`, and `phase12-task-spec-compliance-check.md`
- docs-only/spec_created Phase 11 evidence must be labeled as evidence plan unless actual implementation exists

## Pitfall Candidate

Phase 10 "AC OK" language can overstate a docs-only spec. Prefer "spec trace complete" until code and smoke evidence exist.

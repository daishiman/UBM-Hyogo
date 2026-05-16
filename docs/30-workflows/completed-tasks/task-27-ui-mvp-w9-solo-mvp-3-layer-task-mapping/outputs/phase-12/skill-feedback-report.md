# Skill Feedback Report

## Template Improvement

The 2026-05-15 review found two validator gaps that should be promoted to task-specification-creator:

1. Phase 12 verification must validate root and output `artifacts.json.status` against `.claude/skills/task-specification-creator/schemas/artifact-definition.json`.
2. Phase 12 verification must fail when a Phase 11 evidence path is claimed as `present` but the file does not physically exist.

## Confirmed Pattern

Matrix-style docs-only tasks should not close as `spec_created` once the declared final deliverable is generated. They should move to an implemented local evidence state and keep only PR/commit/push user-gated.

## Workflow Improvement

Phase 12 strict 7 files must be physically present for docs-only / NON_VISUAL workflow packages, and generated final deliverables must move the workflow out of not-yet-generated wording.

Root `status` should remain a schema enum such as `completed`; detailed states such as `implemented_local_evidence_captured` belong in `metadata.workflow_state`.

## Documentation Improvement

Keep future-tense final deliverable wording only when the deliverable file is not present in the same diff.

When a workflow consumes another completed workflow as context, references must use the current canonical path under `docs/30-workflows/completed-tasks/` if the source workflow has already moved there.

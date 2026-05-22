# Skill Feedback Report

## task-specification-creator

| Observation | Routing | Evidence |
| --- | --- | --- |
| Phase 12 strict 7 outputs were missing from the new workflow package. | Applied to this workflow package, no skill change needed. | `outputs/phase-12/` now contains all 7 required files. |
| Root/output artifacts parity existed and should be recorded as evidence. | Applied to compliance check wording. | `phase12-task-spec-compliance-check.md` parity section. |
| Same-wave code diff must promote `spec_created` to implemented-local state. | Applied to workflow artifacts and Phase 11/12 wording. | `artifacts.json` / `outputs/artifacts.json` now use `implemented_local_runtime_pending`. |

## aiworkflow-requirements

| Observation | Routing | Evidence |
| --- | --- | --- |
| The new gate metadata topic needed a canonical discovery path. | Added reference and index entries. | `references/gate-metadata.md`, `indexes/quick-reference.md`, `indexes/resource-map.md`, `references/task-workflow-active.md`. |
| SSOT constraints for path safety, approver format, and `passed_at` nullability must be represented in schema and validator, not only prose. | Applied in shared schema and validator tests. | `packages/shared/src/gate-metadata/schema.ts`, `scripts/gate-metadata/validate.ts`. |

## automation-30

| Observation | Routing | Evidence |
| --- | --- | --- |
| A compact table is sufficient for this small NON_VISUAL spec close-out, but all 30 methods must appear. | Applied locally. | `phase12-task-spec-compliance-check.md`. |

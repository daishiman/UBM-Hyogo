# Phase 2 Output: Payload Design

## Decision

Generate `outputs/phase-13/branch-protection-payload-{dev,main}.json` during the approved Phase 13 execution. The payload source is the Phase 13 pre-apply GET, with only `required_status_checks.contexts` replaced by `outputs/phase-02/expected-contexts-{dev,main}.json`.

## Invariants

| Invariant | Rule |
| --- | --- |
| Context source | Consume UT-GOV-004 only |
| Workflow names | Do not use workflow file names as required contexts unless the check-run name matches exactly |
| Diff surface | Contexts only; all other branch protection values must match pre-apply GET |
| Rollback | Reuse UT-GOV-001 rollback payloads; do not overwrite them |
| Execution | Real PUT is Phase 13 only, after explicit user approval |

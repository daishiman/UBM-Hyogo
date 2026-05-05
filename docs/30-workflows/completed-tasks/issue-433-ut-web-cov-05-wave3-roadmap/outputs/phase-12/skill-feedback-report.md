# Skill Feedback Report

## Template Improvements

Roadmap-style NON_VISUAL workflows should standardize Phase 11 evidence as:

- `verify-indexes-current.md`
- `link-check.md`

The CI file must support `PENDING_CI_EVIDENCE` so planned green is not confused with current green.

## Workflow Improvements

Coverage roadmap workflows need an immutable Phase 6 measurement output and a separate Phase 7 resolved mapping. Updating Phase 6 after Phase 7 weakens evidence traceability.

## Documentation Improvements

aiworkflow coverage wave inventory should include a dedicated wave-3 planning row, and stale historical wave grouping paths should not be used as current canonical evidence roots.

## Applied 30-Method Review Summary

The compact 30-method review grouped failures into four fix clusters: missing materialized outputs, stale repository facts, mutable evidence boundaries, and planned/current CI evidence ambiguity. All four were addressed in this cycle.

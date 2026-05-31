# Skill Feedback Report

## Template Improvement

Small implementation workflows should force an early reclassification check when `implementation_files` are explicit. If local code is changed in the same cycle, `spec_created` must be promoted to an implemented-local state before Phase 12 closes.

## Workflow Improvement

The elegant path for a single navigation relabel is to avoid shared primitive extension unless more than one call site needs the new contract. This keeps scope, tests, and artifact inventory smaller.

## Documentation Improvement

Phase 6 DOM-order examples should use `nextElementSibling` when the requirement says "immediately before"; broad relative-order checks are insufficient.

# Draft PR Template

## Summary

- Add skill ledger conflict prevention task specification.
- Define A-1 / A-2 / A-3 / B-1 runbooks and validation gates.
- Preserve docs-only / NON_VISUAL / spec_created boundaries.

## Validation

- `jq empty docs/30-workflows/task-conflict-prevention-skill-state-redesign/artifacts.json`
- `jq empty docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/artifacts.json`
- artifact output existence check

## Notes

Commit, push, and PR creation are intentionally not executed without explicit user approval.

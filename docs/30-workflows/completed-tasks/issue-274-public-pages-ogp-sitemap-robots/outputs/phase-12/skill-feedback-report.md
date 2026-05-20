# Skill Feedback Report

## Template Improvements
No persistent task-specification template change is required. The existing `verify-all-specs.js` requirements were satisfied by adding canonical section headings to the workflow.

## Workflow Improvements
- New implementation-spec roots should create Phase output placeholder files when root state is `spec_created`.
- Source unassigned tasks should receive consumed trace in the same wave as canonical root creation.
- If implementation diff appears in the same worktree after a `spec_created` root is created, Phase 11/12 and aiworkflow ledgers must be reclassified to implemented-local in the same wave.
- Metadata/SEO tasks should compare helper URL maps against deployed `AUTH_URL` / site URL facts, not only assert that a host "looks valid".

## Documentation Improvements
Issue closure wording should be conservative in `spec_created` workflows. Use `Refs #<issue>` until implementation and evidence are captured.

# Skill Feedback Report — issue-655-d7-recovery-2nd-cycle

## Template Improvements

Recovery / second-cycle workflow tasks need an explicit gate: if a recovery
branch adds `since` / D'+0, the implementation must filter the actual aggregate
window and must keep normal evidence-generation steps enabled with recovery
output paths. Metadata-only `since` and recovery-mode skips are FAIL.

## Workflow Improvements

Applied in this workflow:

- Use canonical `implemented-local-runtime-pending` / `runtime_pending` / `completed` verdicts when local implementation exists.
- Treat recovery-specific labels as explanatory labels, not workflow states.
- Materialize Phase 12 strict 7 after PR-A implementation status is reflected.
- Keep runtime evidence templates separate from runtime PASS evidence, but do not mark captured local evidence as pending.
- For recovery workflows, verify both normal and recovery paths generate URL list, aggregate JSON, leakage log, and comparison evidence.

## Documentation Improvements

The recovery-specific artifact inventory was added to aiworkflow requirements so
future Issue #655 work has a single lookup point. The reusable lesson is the
`since`-filter + evidence-step parity gate above.

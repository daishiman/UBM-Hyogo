# Issue 958 spec-created implementation UX boundary

## Context

`docs/30-workflows/completed-tasks/issue-958-h3-public-filter-ux/` started as an implementation / VISUAL workflow created from a CLOSED Issue follow-up. A later review cycle added app code and focused tests, so keeping the workflow at `spec_created / implementation_pending` became false-green drift.

## Lesson

When an implementation workflow is only created as a spec in the current wave:

- keep workflow root state as `spec_created`;
- add `implementation_state=implementation_pending`;
- mark Phase 11 evidence as pending, not present;
- still materialize root/output artifacts parity and Phase 12 strict 7 planning outputs;
- synchronize aiworkflow-requirements ledgers in the same wave;
- do not claim tests, screenshots, or implementation PASS until code has actually changed.

When code later appears in `apps/` / `packages/` / implementation targets in the same branch:

- immediately reclassify root/output artifacts, Phase 12 summary, system specs, aiworkflow ledgers, and skill feedback from `spec_created` to `implemented_local_runtime_pending` or a stricter implemented-local state;
- replace `planned` target wording with actual implementation paths;
- keep Phase 11 visual evidence pending until screenshots are captured, but do not leave implementation as pending;
- record focused test evidence in Phase 12 once tests pass.

This avoids the ambiguous middle state where an implementation spec looks like a completed execution close-out.

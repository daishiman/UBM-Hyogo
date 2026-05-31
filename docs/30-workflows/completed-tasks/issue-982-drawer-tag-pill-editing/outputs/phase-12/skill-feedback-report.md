# Skill feedback report

## Template improvements

No task-specification-creator template change is required. Existing rules already cover the discovered gaps: strict 7 physical outputs, root/output artifacts parity, workflow state vocabulary, and VISUAL_ON_EXECUTION boundary wording.

## Workflow improvements

Applied locally: for a CLOSED issue that becomes implemented in the same execution cycle, the workflow must be reclassified from `spec_created` to `implemented_local_runtime_pending` and current API references must be promoted in the same wave. This avoids leaving stale "target only / not current" wording after real `apps/` code exists.

## Documentation improvements

Applied locally: Phase 10 and Phase 12 now distinguish "scope-out future product candidates" from "unassigned work escaped from this cycle". This keeps CONST_005 enforceable without creating unnecessary backlog artifacts. Phase 12 also records automation-30 review fixes for DELETE 204 no-body handling and inactive tag assignment.

## Routing

| Item | Routing | Evidence |
| --- | --- | --- |
| strict 7 absence | fixed in workflow outputs | `outputs/phase-12/*.md` |
| artifacts parity drift | fixed in workflow outputs | `cmp -s artifacts.json outputs/artifacts.json` |
| aiworkflow registration gap | fixed in requirements indexes | artifact inventory + quick-reference/resource-map/task-workflow-active entries |
| implemented-current drift | fixed in requirements/API docs | `api-endpoints.md`, `01-api-schema.md`, artifacts state |

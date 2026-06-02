# Skill feedback report

## Template improvements

No task-specification-creator template change is required. Existing rules already cover the
discovered needs: strict 7 physical outputs, root/output artifacts parity, workflow state
vocabulary（`implemented_local_runtime_pending`）, VISUAL_ON_EXECUTION boundary wording, and Phase 12 compliance
canonical headings. The bulk-write third-path case fits within the existing invariant #13
re-definition pattern established by the parent issue-982 workflow.

## Workflow improvements

Applied locally: for a CLOSED issue that is implemented on the current branch, the workflow was
promoted to `implemented_local_runtime_pending` and Step 2 records the implemented interface
shape without reopening the issue. The VISUAL_ON_EXECUTION screenshot canonical names are captured
locally while staging authenticated capture remains user-gated, so the spec / capture metadata /
implementation-guide / ledger 4-way name match is fixed.

## Documentation improvements

Applied locally: the unassigned-task-detection separates `baseline`（parent-recorded scope-out）
from `current cycle`（newly required = 0）, and records #913 / #1035 / pagination as scope-out
別タスク with explicit "not required for any #1036 AC" reasoning. This keeps CONST_005/CONST_007
enforceable without creating backlog artifacts. The implementation guide documents the #913
decoupling (DB natural idempotency) and the audit `batchId` correlation (no `correlation_id`
column) so the optimization rationale is not lost.

## Routing

| Item | Routing | Evidence |
| --- | --- | --- |
| strict 7 presence | created in workflow outputs | `outputs/phase-12/*.md`（7 files） |
| artifacts parity | maintained in workflow outputs | root/output status both `implemented_local_runtime_pending` |
| VISUAL_ON_EXECUTION boundary | recorded in Phase 11 + guide | local screenshots present; staging capture user-gated |
| #913 / #1035 scope-out clarity | recorded in unassigned-task-detection | DB natural idempotency / read-write split rationale |
| invariant #13 third path | recorded in guide + task-C | `bulkApplyMemberTagsByAdmin` + type-level gate allow list |

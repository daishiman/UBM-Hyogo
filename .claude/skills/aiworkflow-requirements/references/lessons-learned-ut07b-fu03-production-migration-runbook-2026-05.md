# Lessons Learned: UT-07B-FU-03 Production Migration Runbook

## L-UT07B-FU03-001: Runbook formalization is not production execution

Production migration runbooks should remain `spec_created` until the actual production apply operation has fresh runtime evidence. Creating a complete runbook does not mean D1 production state changed.

## L-UT07B-FU03-002: Use scoped status labels

Use `DOC_PASS`, `PASS_WITH_OPEN_SYNC`, and `OPERATOR_GATE_OPEN` when a workflow artifact is complete but runtime or repository-wide sync evidence remains open. Avoid bare `PASS` when it can be misread as production execution success.

## L-UT07B-FU03-003: Strict Phase 12 files must be real files

Declaring Phase 12 strict 7 files in `phase-12.md` is insufficient. The files must exist under `outputs/phase-12/`, and root/output `artifacts.json` parity must be materialized or explicitly declared as root-only canonical.

## L-UT07B-FU03-004: Parent seed wording must be consumed

When a follow-up runbook consumes a parent workflow's unassigned candidate, update the parent detection file and artifact inventory in the same wave. Leaving "not formalized" in the parent after FU-03 exists creates stale-current drift.

## L-UT07B-FU03-005: Workflow LOGS and skill LOGS are separate

`docs/30-workflows/LOGS.md` and skill-local `LOGS/_legacy.md` serve different reverse-lookup paths. A same-wave sync that lists LOGS must explicitly decide both, even if one is generated or legacy-shaped.

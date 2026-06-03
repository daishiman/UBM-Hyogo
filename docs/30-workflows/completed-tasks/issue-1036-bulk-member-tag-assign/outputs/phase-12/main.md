# Phase 12 main

Status: `implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION`

## Summary

Issue #1036 is formalized and implemented locally as an implementation workflow for bulk member
tag assign（複数 member × 複数 tag の一括付与/解除）. This Phase 12 close-out covers the
implemented code, local verification, and strict 7 outputs. Commit, PR, GitHub issue mutation,
and staging authenticated visual baseline remain user-gated.

The workflow is the issue-982 followup-003 scope-out, optimized to one implementation cycle:
#913 server idempotency store dependency is removed in favor of `member_tags` composite-PK
natural idempotency, and audit bulk correlation uses a `batchId` embedded in `after_json` /
`before_json` instead of a new `correlation_id` column.

## Strict 7

| File | Status |
| --- | --- |
| `main.md` | present |
| `implementation-guide.md` | present |
| `system-spec-update-summary.md` | present |
| `documentation-changelog.md` | present |
| `unassigned-task-detection.md` | present |
| `skill-feedback-report.md` | present |
| `phase12-task-spec-compliance-check.md` | present |

## Gates

- Gate-A: passed for spec package readiness（Phase 1-3 design fixed, AC mapped, #913 decoupled,
  invariant #13 third write path defined）.
- Gate-B: passed — implementation gate（TDD green, typecheck/lint, contract+repository+type-gate+
  component tests）.
- Gate-C: pending — PR gate（commit/PR creation only after explicit user approval）.

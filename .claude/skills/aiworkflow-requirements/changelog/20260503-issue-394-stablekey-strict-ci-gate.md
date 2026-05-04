# 2026-05-03 Issue #394 stableKey strict CI gate

## Summary

Registered `docs/30-workflows/issue-394-stablekey-strict-ci-gate/` as `spec_created / implementation / NON_VISUAL / blocked_by_legacy_cleanup`.

Current `pnpm lint:stablekey:strict` evidence is exit 1 / 148 violations, so adding a blocking `.github/workflows/ci.yml` step in this wave would break the required `ci` context. The workflow records current blocker evidence and cleanup-after implementation steps without claiming `fully enforced`.

## Updated Canonical References

- `indexes/quick-reference.md` and `indexes/resource-map.md`: 03a stableKey strict blocker updated to 148 current violations and Issue #394 workflow link.
- `references/workflow-03a-stablekey-literal-lint-enforcement-artifact-inventory.md`: completed-tasks path drift fixed and current Issue #394 workflow added.
- `docs/30-workflows/completed-tasks/03a-stablekey-literal-lint-enforcement/outputs/phase-12/unassigned-task-detection.md`: stale `unassigned-task/` paths corrected.
- Issue #394 remains CLOSED and future PR text must use `Refs #394`, not `Closes`.

## Evidence Boundary

- Current evidence: `strict-current-blocker.txt`, `ci-command-trace.md`, `branch-protection-main.json`, `branch-protection-dev.json`.
- Planned-after-cleanup evidence: `strict-pass.txt`, `strict-violation-fail.txt`.
- `.github/workflows/ci.yml` strict step and 03a `fully enforced` promotion remain blocked until strict violations reach 0.

## Skill Feedback Surfaced

- `task-specification-creator`: `PASS_WITH_BLOCKER` closeout requires root/outputs artifacts parity, current/planned evidence separation, truthful Phase 12 compliance, and promoted skill feedback evidence.
- `aiworkflow-requirements`: completed follow-up path drift must be corrected in quick-reference, resource-map, artifact inventories, and parent Phase 12 records in the same wave.

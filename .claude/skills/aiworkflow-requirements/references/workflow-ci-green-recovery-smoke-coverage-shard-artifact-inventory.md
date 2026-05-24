# workflow-ci-green-recovery-smoke-coverage-shard artifact inventory

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/ci-green-recovery-smoke-coverage-shard/` |
| root artifacts | `docs/30-workflows/ci-green-recovery-smoke-coverage-shard/artifacts.json` |
| output artifacts | `docs/30-workflows/ci-green-recovery-smoke-coverage-shard/outputs/artifacts.json` |
| index | `docs/30-workflows/ci-green-recovery-smoke-coverage-shard/index.md` |
| Phase 1 requirements | `docs/30-workflows/ci-green-recovery-smoke-coverage-shard/phase-1-requirements.md` |
| Phase 2 design | `docs/30-workflows/ci-green-recovery-smoke-coverage-shard/phase-2-design.md` |
| Phase 5 implementation plan | `docs/30-workflows/ci-green-recovery-smoke-coverage-shard/phase-5-implementation.md` |
| Phase 9 QA plan | `docs/30-workflows/ci-green-recovery-smoke-coverage-shard/phase-9-qa.md` |
| Phase 11 evidence template | `docs/30-workflows/ci-green-recovery-smoke-coverage-shard/outputs/phase-11/manual-test-result.md` |
| Phase 12 compliance | `docs/30-workflows/ci-green-recovery-smoke-coverage-shard/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| Phase 12 system sync | `docs/30-workflows/ci-green-recovery-smoke-coverage-shard/outputs/phase-12/system-spec-update-summary.md` |
| Phase 13 PR gate | `docs/30-workflows/ci-green-recovery-smoke-coverage-shard/outputs/phase-13/pr-creation-result.md` |
| upstream auth recovery | `docs/30-workflows/task-staging-auth-secret-binding-recovery-001/` |
| upstream runtime smoke 500 recovery | `docs/30-workflows/completed-tasks/task-runtime-smoke-admin-members-500-recovery-001/` |
| coverage split source | `docs/30-workflows/completed-tasks/issue-617-ci-test-time-reduction-split/` |

## Contract

The workflow is `implemented_local_evidence_captured / implementation / NON_VISUAL / runtime_ci_pending`.
It implements one cycle for three CI failure lanes:

- Lane A: replace expiring static staging runtime-smoke bearers with CI-time short-lived session JWT minting.
- Lane B: make aggregate `coverage-gate` fail on upstream shard failure before misleading `MISSING` coverage output.
- Lane C: harden `coverage-gate-shard` checkout with explicit `contents: read` and token wiring.

Code, CI workflow changes, and runbook edits are present in the worktree with local mint parity / smoke shell evidence captured. Runtime CI evidence, staging secret placement, commit, push, and PR remain user-gated.

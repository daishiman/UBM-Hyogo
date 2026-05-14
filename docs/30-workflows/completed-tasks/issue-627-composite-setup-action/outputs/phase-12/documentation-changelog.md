# Documentation Changelog

| date | file | change |
| --- | --- | --- |
| 2026-05-12 | `artifacts.json` | Added root metadata ledger for taskType / visualEvidence / scope / workflow_state. |
| 2026-05-12 | `outputs/phase-11/*` | Added NON_VISUAL required evidence placeholders with runtime_pending boundaries. |
| 2026-05-12 | `outputs/phase-12/*` | Added strict 7 Phase 12 files. |
| 2026-05-12 | `.claude/skills/aiworkflow-requirements/*` | Added same-wave current registration for Issue #627. |
| 2026-05-12 | `phase-13.md` | Replaced close keywords with `Refs #627` because Issue #627 is already CLOSED. |
| 2026-05-13 | `.github/workflows/ci.yml` | Fixed the missed `workflow-shell-lint` setup replacement, expanded changed workflow actionlint coverage, and added a separate composite action structure gate. |
| 2026-05-13 | `.github/actions/setup-project/action.yml` | Replaced nested action tags with pinned SHAs for `pnpm/action-setup`, `actions/setup-node`, and `jdx/mise-action`. |
| 2026-05-13 | `artifacts.json`, `outputs/artifacts.json`, `outputs/phase-11/*`, `outputs/phase-12/*`, `outputs/phase-13/local-check-result.md` | Reclassified the workflow from `spec_created` to `implemented_local_runtime_pending` because real `.github/` implementation changes are present in this cycle. |

# Issue #589 gate metadata structured ledger sync

Date: 2026-05-10

Synced `docs/30-workflows/completed-tasks/issue-589-gate-metadata-structured-ledger/` as `implemented_local_runtime_pending / implementation / NON_VISUAL`.

Changes:

- Implemented `packages/shared/src/gate-metadata/**`, `scripts/gate-metadata/**`, `.github/workflows/verify-gate-metadata.yml`, and Issue #549 artifacts backfill.
- Materialized Phase 11/12 evidence for the implemented-local workflow package.
- Added NON_VISUAL Phase 11 link checklist.
- Added `references/gate-metadata.md` as the aiworkflow-requirements SSOT for structured gate ledgers.
- Registered Issue #589 in quick-reference, resource-map, task-workflow-active, and LOGS.
- Kept Issue #589 and Issue #549 closed; future PR wording must use `Refs` only.

## Implementation struggles (lessons captured)

See `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-589-gate-metadata-2026-05.md` for the full record. Headlines:

- **State promotion judgement**: workflow state moved beyond plain `spec_created` to `implemented_local_runtime_pending` because schema/validator/CI workflow file/Issue #549 backfill landed locally while runtime-promoting branch protection PUT remained user-gated. The `_runtime_pending` suffix encodes the boundary so promotion is mechanical when the user approves.
- **Historical compatibility vs. forward enforcement**: validator must WARN/skip historical `artifacts.json` lacking `metadata.gates[]` while ERROR-failing changed paths under `--require-gates-for-changed`. The dual-mode is implemented in `scripts/gate-metadata/validate.ts` and exercised by the CI workflow against `git diff` output.
- **Approver regex dual form**: `approver` accepts either a GitHub username or `CODEOWNERS:<group>` so codeowner-bound gates can be expressed without spoofing a personal account. The regex is encoded in `packages/shared/src/gate-metadata/schema.ts` and consumed by the validator.

Branch protection mutation, commit, push, and PR remain user-gated. Historical artifacts without `metadata.gates[]` remain WARN/skip for initial rollout compatibility, while changed PR artifacts are required to carry `metadata.gates[]`.

# Phase 12 Task Spec Compliance Check

| Check | Result | Evidence |
| --- | --- | --- |
| Root artifacts present | PASS | `artifacts.json`, `outputs/artifacts.json` |
| Root/output artifacts parity | PASS | `cmp -s docs/30-workflows/completed-tasks/issue-590-phase11-canonical-evidence-paths/artifacts.json docs/30-workflows/completed-tasks/issue-590-phase11-canonical-evidence-paths/outputs/artifacts.json` exit 0 |
| Workflow state parity | PASS | `index.md` 状態 = `implemented-local`; `artifacts.json` state / metadata.workflow_state = `implemented-local` |
| Phase 1-13 specs present | PASS | `phase-01.md` ... `phase-13.md` |
| Phase output mirrors present | PASS | `outputs/phase-01/main.md` ... `outputs/phase-13/main.md` |
| Phase 12 strict 7 present | PASS | `outputs/phase-12/*` |
| Phase 11 stale pending gate | PASS | `outputs/phase-11/main.md` の evidence 5 件は `executed-exit-0` |
| Schema implemented | PASS | `.claude/skills/task-specification-creator/schemas/phase11-evidence-canonical-paths.schema.json` |
| Validator implemented | PASS | `.claude/skills/task-specification-creator/scripts/validate-phase11-canonical-evidence-paths.js` |
| ESM warning cleanup | PASS | `.claude/skills/task-specification-creator/package.json` |
| Validator/schema drift gate | PASS | validator reads schema contract for root/evidence keys, required fields, enum, and pattern; optional field type tests added |
| Tests implemented | PASS | `node --test .claude/skills/task-specification-creator/scripts/__tests__/validate-phase11-canonical-evidence-paths.test.mjs` = 11 tests PASS |
| Self manifest existence gate | PASS | `pnpm validate:phase11-paths docs/30-workflows/completed-tasks/issue-590-phase11-canonical-evidence-paths/outputs/phase-11/canonical-paths.json --check-existence` exit 0 |
| Parent #549 manifest | PASS | `pnpm validate:phase11-paths docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-11/canonical-paths.json` exit 0 |
| Repo typecheck | PASS | `pnpm typecheck` exit 0 |
| Repo lint | PASS | `pnpm lint` exit 0 |
| aiworkflow sync | PASS | quick-reference / resource-map / task-workflow-active / changelog |
| Unassigned supersede | PASS | `u-fix-cf-acct-01-deriv-04-fu-03-d-followup-05.md` status update |
| Git diff issue-590 scope | PASS_WITH_EXTERNAL_DIRTY_DIFF | Issue #590 files are updated. `docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/` deletion remains an external dirty diff in this worktree and is not claimed as Issue #590 output. |
| Path canonicalization (post completed-tasks/ move) | PASS | 2026-05-10 14:20 JST 再検証: workflow が `docs/30-workflows/completed-tasks/issue-590-phase11-canonical-evidence-paths/` へ移動後、canonical-paths.json `workflowDir` / spec docs / aiworkflow indexes / followup-05 supersede header を新パスへ統一し、`pnpm validate:phase11-paths ... --check-existence` exit 0、`pnpm typecheck` exit 0、`pnpm lint` exit 0、`pnpm indexes:rebuild` 完了。 |

# Artifact Inventory — issue-1103-globals-css-shell-block-consolidation

## Summary

`issue-1103-globals-css-shell-block-consolidation` is an `implemented_local_evidence_captured / implementation / NON_VISUAL` workflow. It removes a byte-identical duplicate `parallel-01 P1-1〜P1-5` block from `apps/web/src/styles/globals.css` and preserves the first definition plus the scoped admin responsive override.

Issue #1103 is CLOSED and is not reopened. Commit, push, PR, staging screenshot, and completed-tasks physical move is completed.

## Workflow Artifacts

- `docs/30-workflows/completed-tasks/issue-1103-globals-css-shell-block-consolidation/index.md`
- `docs/30-workflows/completed-tasks/issue-1103-globals-css-shell-block-consolidation/artifacts.json`
- `docs/30-workflows/completed-tasks/issue-1103-globals-css-shell-block-consolidation/outputs/artifacts.json`
- `docs/30-workflows/completed-tasks/issue-1103-globals-css-shell-block-consolidation/outputs/phase-11/manual-test-result.md`
- `docs/30-workflows/completed-tasks/issue-1103-globals-css-shell-block-consolidation/outputs/phase-12/main.md`
- `docs/30-workflows/completed-tasks/issue-1103-globals-css-shell-block-consolidation/outputs/phase-12/phase12-task-spec-compliance-check.md`
- `docs/30-workflows/completed-tasks/issue-1103-globals-css-shell-block-consolidation/outputs/phase-12/implementation-guide.md`

## Implementation Targets

- `apps/web/src/styles/globals.css`

## Evidence

- `grep -n 'data-shell="sidebar"' apps/web/src/styles/globals.css`: 2 matches after consolidation
- `grep -n 'parallel-01 P1-1 page surface' apps/web/src/styles/globals.css`: 1 match after consolidation
- `git diff --stat`: `apps/web/src/styles/globals.css | 132 deletions(-)`
- `mise exec -- pnpm --filter @ubm-hyogo/web build`: PASS
- `mise exec -- pnpm --filter @ubm-hyogo/web lint`: PASS
- `mise exec -- pnpm verify:tokens`: PASS
- `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/__tests__/tokens.runtime.spec.ts`: 1 file / 9 tests PASS

## Boundary

- No `apps/api`, D1, auth, route, token definition, or public contract change.
- Visual category remains `NON_VISUAL`: byte-identical deletion in the same cascade context does not change computed style.
- Source unassigned task is logically consumed; workflow physical move to `completed-tasks/` is completed.

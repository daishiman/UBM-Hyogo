# Issue #300 Direct Stable Key Update Guard Artifact Inventory

## Current Canonical Set

| Kind | Path | Status |
| --- | --- | --- |
| workflow root | `docs/30-workflows/issue-300-direct-stable-key-update-guard/` | implemented_local_runtime_pending |
| guard script | `scripts/lint-stable-key-update.mjs` | present |
| guard spec | `scripts/lint-stable-key-update.spec.ts` | present / 12 tests |
| fixtures | `scripts/__fixtures__/stable-key-update-lint/` | present |
| removed helper | `apps/api/src/repository/schemaQuestions.ts#updateStableKey` | removed |
| CI workflow | `.github/workflows/verify-stable-key-update.yml` | present / runtime pending |
| pre-commit hook | `lefthook.yml#block-stable-key-update` | present |
| package scripts | `package.json#lint:stable-key-update`, `package.json#lint:stable-key-update:strict` | present |
| reference contract | `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` | synced |
| origin unassigned | `docs/30-workflows/unassigned-task/task-issue-191-direct-stable-key-update-guard-001.md` | consumed trace |

## Boundary

Local implementation and local evidence are complete. GitHub Actions runtime green, commit, push, PR creation, and completed-tasks archive move remain user-gated Phase 13 work.

## Validation Chain

```bash
pnpm lint:stable-key-update:strict
pnpm vitest run scripts/lint-stable-key-update.spec.ts
node .claude/skills/aiworkflow-requirements/scripts/validate-structure.js
node .claude/skills/aiworkflow-requirements/scripts/generate-index.js
```

## Notes

- Phase 13 (GitHub Actions runtime green / commit / push / PR / `completed-tasks/` archive move) is user-gated.
- The workflow consumes `docs/30-workflows/unassigned-task/task-issue-191-direct-stable-key-update-guard-001.md`. Trace string `consumed_by_issue_300 -> docs/30-workflows/issue-300-direct-stable-key-update-guard/` is mirrored on the three issue-191 inventories (`workflow-issue-191-schema-aliases-artifact-inventory.md`, `workflow-task-issue-191-production-d1-schema-aliases-apply-001-artifact-inventory.md`, `workflow-task-issue-191-schema-aliases-implementation-001-artifact-inventory.md`).
- Detector severity matrix and EXCEPTION_GLOBS rationale are recorded in `lessons-learned/lessons-learned-issue-300-direct-stable-key-update-guard-2026-05.md` (L-ISSUE300-001 .. L-ISSUE300-005).

## References

- `lessons-learned/lessons-learned-issue-300-direct-stable-key-update-guard-2026-05.md`

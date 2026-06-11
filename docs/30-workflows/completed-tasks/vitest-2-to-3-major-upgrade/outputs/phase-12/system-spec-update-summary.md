# System Spec Update Summary

## Step 1-A: Workflow registration

| Target | Status | Evidence |
| --- | --- | --- |
| workflow root | completed | `docs/30-workflows/completed-tasks/vitest-2-to-3-major-upgrade/` |
| artifact inventory | completed | `.claude/skills/aiworkflow-requirements/references/workflow-vitest-2-to-3-major-upgrade-artifact-inventory.md` |
| active ledger | completed | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` |
| generated indexes | completed | `pnpm indexes:rebuild` was run after same-wave edits; generated diffs are present in topic-map / keywords |

## Step 1-B: Implementation status

| Item | Status |
| --- | --- |
| FR-1 root `vitest` bump | completed: `package.json` now uses `^3.2.6` |
| FR-2 root `@vitest/coverage-v8` bump | completed: `package.json` now uses `^3.2.6` |
| FR-3 `apps/api` `vitest` bump | completed: `apps/api/package.json` now uses `^3.2.6` |
| FR-4 `apps/og` `vitest` bump | completed: `apps/og/package.json` now uses `^3.2.6` |
| FR-5 lockfile regeneration | completed: `pnpm-lock.yaml` resolves `vitest` and `@vitest/coverage-v8` to 3.2.6 |
| FR-6 deprecation log collection | completed: `outputs/phase-11/deprecation-grep.txt` records config deprecation count 0 |
| FR-7 breaking-change test fixes | completed: RED 0 for C1-C8; no test expectation or config edits required |

## Step 1-C: Related tasks and references

| Reference | Relationship |
| --- | --- |
| PR #1177 | Source Dependabot bump. Still OPEN as of `gh pr view 1177` on 2026-06-10 JST. |
| `issue-747-vitest-esbuild-arch-and-worktree-isolation` | Sibling recovery runbook for Vitest/esbuild runtime failures. |
| `task-specification-creator` Phase 12 strict 7 | Governs this close-out package. |

## Step 2: Domain system spec decision

Step 2 is N/A. Reason: 依存バージョン更新のみで、公開 API / 型 / 定数の変更がないため、新規インターフェース追加は N/A.

No `apps/api` endpoint, D1 schema, Google Form contract, public UI contract, or shared package runtime interface is changed by this implementation.

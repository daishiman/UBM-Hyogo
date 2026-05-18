# Documentation Changelog

## 2026-05-17

### Added

- `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/artifacts.json`
- `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/outputs/artifacts.json`
- `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/outputs/phase-12/main.md`
- `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/outputs/phase-12/system-spec-update-summary.md`
- `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/outputs/phase-12/documentation-changelog.md`
- `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/outputs/phase-12/skill-feedback-report.md`
- `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/outputs/phase-12/phase12-task-spec-compliance-check.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-issue-747-vitest-esbuild-arch-and-worktree-isolation-artifact-inventory.md`
- `.github/workflows/verify-esbuild.yml`
- `scripts/verify-node-arch.mjs`
- `scripts/verify-worktree-node-modules-isolation.mjs`
- `scripts/verify-esbuild-version.mjs`

### Updated

- `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/index.md`
- `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/outputs/phase-03.md`
- `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/outputs/phase-08.md`
- `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/outputs/phase-10.md`
- `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/outputs/phase-11.md`
- `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/outputs/phase-12.md`
- `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/outputs/phase-12/system-spec-update-summary.md`
- `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/outputs/phase-12/phase12-task-spec-compliance-check.md`
- `docs/30-workflows/unassigned-task/parallel-09-followup-002-vitest-esbuild-version-alignment.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-issue-747-vitest-esbuild-arch-and-worktree-isolation-artifact-inventory.md`
- `.mise.toml`
- `CLAUDE.md`
- `lefthook.yml`
- `package.json`
- `pnpm-lock.yaml`

### Verification Notes

- Phase 12 strict 7 file names are present.
- Root/output `artifacts.json` parity is verified by `cmp -s`.
- Issue #747 remains closed and is referenced only by `Refs #747`.

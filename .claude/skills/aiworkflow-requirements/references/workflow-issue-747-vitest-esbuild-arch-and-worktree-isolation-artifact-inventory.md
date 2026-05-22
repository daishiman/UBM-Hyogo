# Workflow Artifact Inventory: Issue #747 Vitest esbuild arch & worktree isolation

## Canonical Root

`docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/`

## State

| Field | Value |
| --- | --- |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented_local_runtime_blocked_node_arch |
| evidence_state | PARTIAL_LOCAL_EVIDENCE_NODE_ARCH_BLOCKED |
| issue_reference_mode | `Refs #747` only |

## Canonical Files

| Category | Files |
| --- | --- |
| root | `index.md`, `artifacts.json`, `outputs/artifacts.json` |
| phases | `outputs/phase-01.md` through `outputs/phase-13.md` |
| Phase 12 strict 7 | `outputs/phase-12/main.md`, `implementation-guide.md`, `system-spec-update-summary.md`, `documentation-changelog.md`, `unassigned-task-detection.md`, `skill-feedback-report.md`, `phase12-task-spec-compliance-check.md` |
| source consumed task | `docs/30-workflows/unassigned-task/parallel-09-followup-002-vitest-esbuild-version-alignment.md` |
| implementation | `scripts/verify-node-arch.mjs`, `scripts/verify-worktree-node-modules-isolation.mjs`, `scripts/verify-esbuild-version.mjs`, `package.json`, `pnpm-lock.yaml`, `lefthook.yml`, `.github/workflows/verify-esbuild.yml`, `.mise.toml`, `CLAUDE.md` |
| Phase 11 evidence | `outputs/phase-11/evidence/*.txt` |

## Implementation Contract

- Add root `esbuild@0.27.3` devDependency and `verify-node-arch`, `verify-worktree-isolation`, `verify-esbuild`, `verify:vitest-runtime`, `test:parallel09-primitives`, and `test:parallel09-use-admin-mutation` scripts.
- Use root `package.json` focused Vitest scripts so local docs and CI share one command contract.
- Record runner architecture with `uname -m` and `process.arch`.
- Keep `scripts/cf.sh` `ESBUILD_BINARY_PATH` behavior as Cloudflare deploy-specific mitigation, not as a Vitest default.

## Downstream Gates

Local `verify:node-arch` remains blocked until Node is reinstalled/rerun as arm64 on Apple Silicon. Commit, push, PR creation, GitHub Actions runtime evidence, and parent repository `node_modules` cleanup remain user-gated.

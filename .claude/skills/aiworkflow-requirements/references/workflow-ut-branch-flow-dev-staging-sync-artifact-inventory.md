# Workflow Artifact Inventory: ut-branch-flow-dev-staging-sync

| 項目 | パス | 役割 |
| --- | --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/ut-branch-flow-dev-staging-sync/` | feature → dev → main 運用切替の正本（close-out 後 completed-tasks 配下） |
| root ledger | `docs/30-workflows/completed-tasks/ut-branch-flow-dev-staging-sync/artifacts.json` | workflow metadata 正本 |
| outputs ledger | `docs/30-workflows/completed-tasks/ut-branch-flow-dev-staging-sync/outputs/artifacts.json` | root parity evidence |
| Phase 11 evidence | `docs/30-workflows/completed-tasks/ut-branch-flow-dev-staging-sync/outputs/phase-11/` | NON_VISUAL smoke |
| Phase 12 strict outputs (7 files) | `docs/30-workflows/completed-tasks/ut-branch-flow-dev-staging-sync/outputs/phase-12/` | `main.md` / `implementation-guide.md` / `documentation-changelog.md` / `phase12-task-spec-compliance-check.md` / `skill-feedback-report.md` / `system-spec-update-summary.md` / `unassigned-task-detection.md` |
| worktree script | `scripts/new-worktree.sh` | feature branch base = `origin/dev` |
| PR flow doc | `CLAUDE.md` | default PR base = `dev` |
| PR command | `.claude/commands/ai/diff-to-pr.md` | remote sync + PR base = `dev` |
| development guideline | `references/development-guidelines-core.md` | Git workflow table merge target = `dev` for feature/fix/refactor branches |

## deleted / archived workflow boundary

`docs/30-workflows/ut-05a-auth-ui-logout-button-001/` は本 wave 終了時点で active root から撤回済み（close-out により `docs/30-workflows/completed-tasks/ut-05a-auth-ui-logout-button-001/` へ移管）。active indexes must not point to the retired root path. Historical lesson files may continue to mention it as history, but current evidence links must resolve through this branch-flow inventory or surviving implementation files under `completed-tasks/`.

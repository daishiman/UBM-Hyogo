# Artifact Inventory: Issue #348 09c GitHub Release Tag Automation

| Item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/issue-348-09c-github-release-tag-automation/` |
| source unassigned | `docs/30-workflows/unassigned-task/task-09c-github-release-tag-automation-001.md` |
| scripts | `scripts/release/` |
| workflow | `.github/workflows/release-create.yml` |
| runbook | `docs/runbooks/release-create.md` |
| SSOT | `references/release-runbook.md` |
| status | implemented-local / implementation / NON_VISUAL / release apply user-gated |

## Evidence

- Local deterministic tests: `bash scripts/release/__tests__/run-all.sh`
- Phase 11 generic NON_VISUAL manifest: `outputs/phase-11/main.md`
- Phase 12 strict outputs: `outputs/phase-12/`

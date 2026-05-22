# Workflow Artifact Inventory: Issue #554 audit correlation required status check

| Item | Path |
| --- | --- |
| Root | `docs/30-workflows/issue-554-audit-correlation-branch-protection-required-check/` |
| Ledger | `docs/30-workflows/issue-554-audit-correlation-branch-protection-required-check/artifacts.json` |
| Index | `docs/30-workflows/issue-554-audit-correlation-branch-protection-required-check/index.md` |
| Phase 12 main | `outputs/phase-12/main.md` |
| Implementation guide | `outputs/phase-12/implementation-guide.md` |
| System spec update summary | `outputs/phase-12/system-spec-update-summary.md` |
| Documentation changelog | `outputs/phase-12/documentation-changelog.md` |
| Unassigned detection | `outputs/phase-12/unassigned-task-detection.md` |
| Skill feedback | `outputs/phase-12/skill-feedback-report.md` |
| Compliance check | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## Runtime evidence reserved paths

| Evidence | Timing |
| --- | --- |
| `outputs/phase-11/before-dev-protection.json` | captured before Phase 13 (read-only GET) |
| `outputs/phase-11/before-main-protection.json` | captured before Phase 13 (read-only GET) |
| `outputs/phase-11/after-dev-protection.json` | Phase 13 user approval after |
| `outputs/phase-11/after-main-protection.json` | Phase 13 user approval after |
| `outputs/phase-11/diff-summary.md` | partial captured before Phase 13; update after approved PUT |

## Boundaries

- Issue #554 remains CLOSED; PR text must use `Refs #554`.
- `gh api -X PUT`, after snapshots, commit, push, and PR creation are user-gated.
- The source unassigned task remains trace evidence, not the active workflow root.

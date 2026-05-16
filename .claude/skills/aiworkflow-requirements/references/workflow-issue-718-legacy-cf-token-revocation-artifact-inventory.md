# Workflow Artifact Inventory: Issue #718 Legacy Cloudflare API Token Revocation

## Metadata

| Field | Value |
| --- | --- |
| Workflow root | `docs/30-workflows/issue-718-legacy-cf-token-revocation/` |
| State | `spec_created_runtime_gate_pending / implementation / NON_VISUAL` |
| Source unassigned | `docs/30-workflows/unassigned-task/issue-640-followup-002-legacy-token-revocation.md` |
| Parent workflow | `docs/30-workflows/completed-tasks/issue-640-oidc-cf-token-cutover/` |
| Issue | `#718` closed; PR text must use `Refs #718` |
| Gate model | Gate A spec close -> Gate B git publish -> Gate C external revocation |

## Canonical Artifacts

| Path | Role |
| --- | --- |
| `docs/30-workflows/issue-718-legacy-cf-token-revocation/index.md` | Canonical workflow entrypoint |
| `docs/30-workflows/issue-718-legacy-cf-token-revocation/artifacts.json` | Root artifact ledger |
| `docs/30-workflows/issue-718-legacy-cf-token-revocation/outputs/artifacts.json` | Full mirror of root artifact ledger |
| `docs/30-workflows/issue-718-legacy-cf-token-revocation/phase-1-requirements.md` ... `phase-13-pr.md` | Phase 1-13 task specification files |
| `docs/30-workflows/issue-718-legacy-cf-token-revocation/outputs/phase-11/evidence/legacy-token-usage-inventory.md` | Read-only inventory evidence collected before Gate C |
| `docs/30-workflows/issue-718-legacy-cf-token-revocation/outputs/phase-11/evidence/github-secrets-before.md` | Template pending user permission |
| `docs/30-workflows/issue-718-legacy-cf-token-revocation/outputs/phase-11/evidence/revocation-evidence.md` | Gate C mutation evidence placeholder |
| `docs/30-workflows/issue-718-legacy-cf-token-revocation/outputs/phase-11/evidence/github-secrets-after.md` | Gate C after-evidence placeholder |
| `docs/30-workflows/issue-718-legacy-cf-token-revocation/outputs/phase-11/evidence/onepassword-item-status.md` | Gate C 1Password status placeholder |
| `docs/30-workflows/issue-718-legacy-cf-token-revocation/outputs/phase-12/main.md` | Phase 12 summary |
| `docs/30-workflows/issue-718-legacy-cf-token-revocation/outputs/phase-12/implementation-guide.md` | Operator and reviewer implementation guide |
| `docs/30-workflows/issue-718-legacy-cf-token-revocation/outputs/phase-12/phase12-task-spec-compliance-check.md` | Strict Phase 12 compliance check |
| `docs/30-workflows/issue-718-legacy-cf-token-revocation/outputs/phase-12/system-spec-update-summary.md` | Same-wave system spec summary |
| `docs/30-workflows/issue-718-legacy-cf-token-revocation/outputs/phase-12/skill-feedback-report.md` | Skill feedback report |
| `docs/30-workflows/issue-718-legacy-cf-token-revocation/outputs/phase-12/unassigned-task-detection.md` | Gate C pending classification |
| `docs/30-workflows/issue-718-legacy-cf-token-revocation/outputs/phase-12/documentation-changelog.md` | Documentation change log |

## Same-Wave System Spec Sync

| Path | Update |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | Issue #718 Gate C retirement path, redaction rules, approval marker |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Active workflow registration |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | Lookup entry and corrected Issue #640 completed-task path |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | Resource map entry |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | Latest history row |
| `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` | Full changelog row |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | Execution log row |
| `.claude/skills/aiworkflow-requirements/changelog/20260516-issue718-legacy-cf-token-revocation.md` | Dedicated changelog entry |

## Gate C Blockers

| Blocker | Required resolution |
| --- | --- |
| Active `secrets.CLOUDFLARE_API_TOKEN` workflow references | Fresh inventory must show 0 active references before revocation |
| External mutation approval | Save `outputs/phase-13/user-approval-issue-718-<timestamp>.md` before Cloudflare / GitHub / 1Password mutation |
| Runtime evidence | Capture redacted before/after evidence without token values, previews, suffixes, account IDs, vault values, or stable hashes |

## Scope Note

The current worktree also contains i01 ToastProvider files and `apps/web/app/layout.tsx` changes. Those belong to a separate implementation wave and are not Issue #718 artifacts or evidence.

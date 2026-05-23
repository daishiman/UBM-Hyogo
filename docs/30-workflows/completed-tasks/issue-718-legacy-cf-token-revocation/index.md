# Issue #718 Legacy Cloudflare API Token Revocation

> Source issue: [#718](https://github.com/daishiman/UBM-Hyogo/issues/718) `[issue-640-followup-002] Legacy Cloudflare API Token Revocation`
> implementation_mode: `external-governance-operation`
> task classification: `implementation / NON_VISUAL`
> workflow_state: `spec_created_runtime_gate_pending`
> Gate model: `Gate A spec close` -> `Gate B git publish` -> `Gate C external revocation`

## 1. Overview

This workflow promotes `docs/30-workflows/unassigned-task/issue-640-followup-002-legacy-token-revocation.md` into the canonical Issue #718 execution root.

The task is not a pure note: it defines a concrete, user-gated operational implementation for retiring the legacy long-lived Cloudflare deploy token after Issue #640 step-scoped token cutover has runtime evidence. The external mutation itself is intentionally blocked until explicit user approval because token revocation, GitHub secret deletion, and 1Password item mutation are irreversible governance operations.

## 2. Scope

In scope:

- Repository-wide legacy token usage inventory before revocation.
- Read-only GitHub / repository evidence that can be gathered before approval.
- Operator-approved Cloudflare API Token revocation or rotation.
- Operator-approved GitHub Secret deletion or replacement.
- 1Password item status reconciliation by item name only.
- Same-wave update of `deployment-secrets-management.md` and aiworkflow indexes.

Out of scope:

- Full OIDC migration, tracked by `issue-640-followup-001-oidc-full-migration`.
- New token issuance or rotation beyond the legacy retirement path.
- Recording token values, suffixes, account IDs, vault secret values, or token hashes.

## 3. Phase List

| Phase | Name | Status | Artifact |
| --- | --- | --- | --- |
| 1 | Requirements | completed | `phase-1-requirements.md` |
| 2 | Design | completed | `phase-2-design.md` |
| 3 | Design review | completed | `phase-3-design-review.md` |
| 4 | Test plan | completed | `phase-4-test-plan.md` |
| 5 | Implementation plan | completed | `phase-5-implementation.md` |
| 6 | Test additions | completed | `phase-6-test-additions.md` |
| 7 | Coverage | completed | `phase-7-coverage.md` |
| 8 | Refactor | completed | `phase-8-refactor.md` |
| 9 | Quality assurance | completed | `phase-9-qa.md` |
| 10 | Final review | completed | `phase-10-final-review.md` |
| 11 | NON_VISUAL evidence | runtime_pending_user_gate | `phase-11-manual-test.md` |
| 12 | Documentation sync | completed | `phase-12-documentation.md` |
| 13 | Approval and PR | blocked_pending_user_approval | `phase-13-pr.md` |

## 4. Invariants

1. `CLOUDFLARE_API_TOKEN` may remain as a step-local environment variable name for compatibility, but it must not be job-level or broad-scope.
2. No AI-run mutation is allowed before a saved user approval marker exists.
3. Evidence stores command names, exit codes, secret names, and item names only.
4. `actual_read_only_evidence_files` and `actual_mutation_evidence_files` remain separate ledgers.
5. Runtime state cannot be marked `completed` while Gate C is pending.

## 5. Primary Deliverables

| Path | Role |
| --- | --- |
| `artifacts.json` | Root metadata, gate model, evidence ledgers |
| `outputs/artifacts.json` | Mirror ledger for Phase outputs |
| `outputs/phase-11/evidence/legacy-token-usage-inventory.md` | Read-only usage inventory command contract |
| `outputs/phase-11/evidence/github-secrets-before.md` | Read-only name-only secret inventory contract |
| `outputs/phase-11/evidence/revocation-evidence.md` | Gate C mutation evidence placeholder |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | Strict compliance and 4-condition verdict |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | Canonical secret inventory status |

## 6. Dependencies

| Type | Dependency | Required State |
| --- | --- | --- |
| Upstream | Issue #640 step-scoped CF token cutover | staging / production runtime evidence green before Gate C |
| Active consumer guard | `secrets.CLOUDFLARE_API_TOKEN` live workflow references | 0 active references before Gate C revocation |
| Optional upstream | `issue-640-followup-001-oidc-full-migration` | only required if operator chooses OIDC-first retirement |
| External gate | Cloudflare / GitHub / 1Password operator approval | required before revocation or deletion |

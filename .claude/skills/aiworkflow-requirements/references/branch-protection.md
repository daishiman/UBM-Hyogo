# Branch Protection Governance

## Current contract

GitHub branch protection for `dev` and `main` is an external setting. Repository files record the intended contract and evidence paths, but fresh GitHub GET/PUT evidence is authoritative after user-approved operations.

## Required status checks

| Context | Scope | Status |
| --- | --- | --- |
| `audit-correlation-verify / verify` | `dev`, `main` | Issue #554 contract-ready; PUT blocked until user approval |

## Invariants

These are intended governance invariants. Fresh GitHub GET evidence may reveal drift; Issue #554 Phase 13 must preserve current values by default and must not silently correct drift without explicit user approval.

| Field | Expected |
| --- | --- |
| `required_pull_request_reviews` | `null` |
| `lock_branch` | `false` |
| `enforce_admins` | `true` |
| `required_linear_history` | `true` |
| `required_conversation_resolution` | `true` |

## Issue #554 runbook

Workflow root: `docs/30-workflows/issue-554-audit-correlation-branch-protection-required-check/`

Before applying the required context:

1. Confirm `.github/workflows/audit-correlation-verify.yml` has at least one successful `main` run.
2. Capture `before-{dev,main}-protection.json`.
3. Build branch-specific normalized PUT payloads by merging `audit-correlation-verify / verify` into existing contexts while preserving current values for all other branch protection fields.
4. Apply `dev` first, verify invariants, then apply `main`.
5. Capture `after-{dev,main}-protection.json` and `diff-summary.md`.

Commit, push, PR creation, and GitHub branch protection mutation require explicit user approval.

If before snapshots show drift from the intended invariants, Phase 13 requires a user decision: contexts-only apply, same-operation drift correction, or separate task creation.

## References

- Workflow (Issue #554): `docs/30-workflows/issue-554-audit-correlation-branch-protection-required-check/`
- Artifact inventory: `references/workflow-issue-554-audit-correlation-branch-protection-required-check-artifact-inventory.md`
- Parent (Issue #516): `docs/30-workflows/completed-tasks/issue-516-github-audit-log-cross-source-correlation/`
- SSOT (related): `references/audit-correlation.md`
- Lessons learned: `lessons-learned/lessons-learned-issue-554-branch-protection-required-check-2026-05.md`
- Changelog: `changelog/20260508-issue554-audit-correlation-required-check.md`

# Workflow Artifact Inventory: Issue #626 RB-01 Build Output Sharing

| Field | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-626-rb01-share-build-output-lighthouse-pr-build/` |
| state | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / implementation / NON_VISUAL` |
| issue | Issue #626 CLOSED; parent Issue #608 CLOSED |
| PR wording | `Refs #626, #608` only |

## Canonical Artifacts

| Path | Role |
| --- | --- |
| `docs/30-workflows/completed-tasks/issue-626-rb01-share-build-output-lighthouse-pr-build/index.md` | task overview, scope, adoption decision |
| `docs/30-workflows/completed-tasks/issue-626-rb01-share-build-output-lighthouse-pr-build/artifacts.json` | root workflow ledger |
| `docs/30-workflows/completed-tasks/issue-626-rb01-share-build-output-lighthouse-pr-build/outputs/artifacts.json` | Phase evidence mirror; must match root ledger |
| `docs/30-workflows/completed-tasks/issue-626-rb01-share-build-output-lighthouse-pr-build/phase-01.md` - `phase-13.md` | executable task specification |
| `docs/30-workflows/completed-tasks/issue-626-rb01-share-build-output-lighthouse-pr-build/outputs/phase-11/` | local deterministic evidence, read-only branch-protection current evidence, and explicit pending runtime evidence markers |
| `docs/30-workflows/completed-tasks/issue-626-rb01-share-build-output-lighthouse-pr-build/outputs/phase-12/` | required strict 7 files after execution |

## Implementation Targets

| Path | Expected action |
| --- | --- |
| `.github/workflows/pr-build-test.yml` | add `lighthouse-ci` job, upload standard `.next` artifact immediately after standard `Build`, download artifact in `lighthouse-ci`, keep `build-test` / `lighthouse-ci` names |
| `.github/workflows/lighthouse.yml` | delete after integration |
| `docs/30-workflows/e2e-quality-uplift/backlog.md` | update RB-01 status to `implemented-local-runtime-pending` and notes |
| `lighthouserc.json` | read-only unless Lighthouse URL contract changes |

## Evidence Boundary

- Local deterministic evidence: typecheck, lint, actionlint, patch regression, secret grep.
- Runtime CI evidence: dry-run PR `build-test` and `lighthouse-ci` checks, `lighthouse-ci` log with no build step. These are pending user-gated PR creation.
- Governance evidence: read-only current `dev` / `main` branch protection JSON before PR, plus merge-time before/after diff after user-gated PR merge.
- User-gated operations: commit, push, PR, merge, Issue close mutation.

## State Vocabulary

- `spec_created`: historical specification-only state before local workflow edits.
- `implemented_local_evidence_captured`: local deterministic evidence captured after workflow edit.
- `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`: current state; GitHub Actions runtime evidence and merge gate pending.
- `completed`: Phase 13 close-out complete.

N-day observation state terms are not used for this workflow.

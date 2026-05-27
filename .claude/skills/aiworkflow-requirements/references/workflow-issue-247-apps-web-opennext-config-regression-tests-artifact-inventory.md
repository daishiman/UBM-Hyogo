# Workflow Artifact Inventory: issue-247 apps/web OpenNext config regression tests

## Summary

| Field | Value |
| --- | --- |
| workflow | `docs/30-workflows/completed-tasks/issue-247-apps-web-opennext-config-regression-tests/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| issue | #247 |
| parent | `docs/30-workflows/completed-tasks/ut-06-followup-A-opennext-workers-migration.md` |
| source | `docs/30-workflows/completed-tasks/issue-247-apps-web-opennext-config-regression-tests/UT-06-FU-A-open-next-config-regression-tests.md`（consumed_by_issue_247） |

## Implementation

| Path | Role |
| --- | --- |
| `apps/web/__tests__/opennext-config-regression.spec.ts` | Focused Vitest guard for OpenNext Workers config invariants |
| `.github/workflows/ci.yml` | Runs focused guard after typecheck in the `ci` job |

## Evidence

| Path | Status |
| --- | --- |
| `outputs/phase-11/manual-test-result.md` | present |
| `outputs/phase-12/main.md` | present |
| `outputs/phase-12/implementation-guide.md` | present |
| `outputs/phase-12/system-spec-update-summary.md` | present |
| `outputs/phase-12/documentation-changelog.md` | present |
| `outputs/phase-12/unassigned-task-detection.md` | present |
| `outputs/phase-12/skill-feedback-report.md` | present |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | present |
| `artifacts.json` / `outputs/artifacts.json` | present |

## Same-Wave Sync

| Path | Status |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md` | regression guard section added |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | issue-247 entry added |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | issue-247 row added |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active entry added |
| `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-issue-247-apps-web-opennext-config-regression-tests-2026-05.md` | present |
| `.claude/skills/aiworkflow-requirements/changelog/20260526-issue-247-apps-web-opennext-config-regression-tests.md` | present |

## User-Gated Boundary

Commit, push, PR creation, and GitHub Issue #247 mutation remain pending until explicit user approval.

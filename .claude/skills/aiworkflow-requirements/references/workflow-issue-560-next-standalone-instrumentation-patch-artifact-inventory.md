# Artifact Inventory — Issue #560 Next Standalone Instrumentation Patch

## Canonical Root

`docs/30-workflows/issue-560-task-03-followup-002-next-standalone-instrumentation-patch/`

## Root Artifacts

| Artifact | Status |
| --- | --- |
| `index.md` | present |
| `artifacts.json` | present |
| `outputs/artifacts.json` | present |
| `phase-01.md` ... `phase-13.md` | present |

## Phase 12 Required Artifacts

| Artifact | Status |
| --- | --- |
| `outputs/phase-12/main.md` | present |
| `outputs/phase-12/implementation-guide.md` | present |
| `outputs/phase-12/system-spec-update-summary.md` | present |
| `outputs/phase-12/documentation-changelog.md` | present |
| `outputs/phase-12/unassigned-task-detection.md` | present |
| `outputs/phase-12/skill-feedback-report.md` | present |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | present |

## Implemented Artifacts

| Artifact | Role |
| --- | --- |
| `scripts/patch-next-standalone-instrumentation.mjs` | Patch script hardened with `cwd` guard, `--verify-only`, trace parse failure handling, and structured logs |
| `scripts/__tests__/patch-next-standalone-instrumentation.test.mjs` | Regression tests for trace copy, verify mode, and malformed trace failure |
| `apps/web/open-next.config.ts` | Current buildCommand route |
| `.github/workflows/pr-build-test.yml` | CI gate owner |
| `docs/runbooks/next-standalone-instrumentation-patch.md` | Upgrade and removal runbook |

## State Classification

`workflow_state = implemented-local`

`taskType = implementation`

`visualEvidence = NON_VISUAL`

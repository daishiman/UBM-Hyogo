# Artifact Inventory — 02c-followup-002-fixtures-prod-build-exclusion

## canonical root

`docs/30-workflows/02c-followup-002-fixtures-prod-build-exclusion/`

## root artifacts

| artifact | status |
| --- | --- |
| `index.md` | present |
| `artifacts.json` | present |
| `outputs/artifacts.json` | present |
| `phase-01.md` ... `phase-13.md` | present |

## phase 12 required artifacts

| artifact | status |
| --- | --- |
| `outputs/phase-12/main.md` | present |
| `outputs/phase-12/implementation-guide.md` | present |
| `outputs/phase-12/documentation-changelog.md` | present |
| `outputs/phase-12/system-spec-update-summary.md` | present |
| `outputs/phase-12/unassigned-task-detection.md` | present |
| `outputs/phase-12/skill-feedback-report.md` | present |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | present |

## implementation artifacts

| artifact | status |
| --- | --- |
| `apps/api/tsconfig.build.json` | added |
| `apps/api/package.json` | build script updated |
| `.dependency-cruiser.cjs` | boundary rule added |
| root `package.json` | `lint:deps` added and linked from `lint` |

## deferred evidence

| artifact | owner |
| --- | --- |
| full api test green | `docs/30-workflows/unassigned-task/task-02c-followup-002-sync-forms-responses-test-baseline-001.md` |
| real wrangler dry-run bundle evidence | `docs/30-workflows/unassigned-task/task-02c-followup-002-wrangler-dry-run-evidence-001.md` |

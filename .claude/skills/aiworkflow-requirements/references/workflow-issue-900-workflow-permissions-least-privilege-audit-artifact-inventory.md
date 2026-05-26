# Workflow Artifact Inventory: issue-900-workflow-permissions-least-privilege-audit

| Field | Value |
| --- | --- |
| Workflow root | `docs/30-workflows/completed-tasks/issue-900-workflow-permissions-least-privilege-audit/` |
| Status | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| Issue | #900 CLOSED; PR text must use `Refs #900` |
| Root artifacts | `artifacts.json`, `outputs/artifacts.json` |
| Phase 11 evidence | `outputs/phase-11/manual-test-result.md`, `outputs/phase-11/verify-script-output.txt`, `outputs/phase-11/workflow-diff.txt` |
| Phase 12 strict 7 | `outputs/phase-12/{main.md,implementation-guide.md,system-spec-update-summary.md,documentation-changelog.md,unassigned-task-detection.md,skill-feedback-report.md,phase12-task-spec-compliance-check.md}` |
| Phase 13 boundary | `outputs/phase-13/pr-creation-result.md` |

## Implementation Targets

| Path | Change |
| --- | --- |
| `.github/workflows/backend-ci.yml` | top-level `permissions: contents: read` |
| `.github/workflows/d1-migration-verify.yml` | top-level `permissions: contents: read` |
| `.github/workflows/e2e-tests.yml` | top-level `permissions: contents: read` |
| `.github/workflows/lighthouse.yml` | top-level `permissions: contents: read` |
| `.github/workflows/playwright-smoke.yml` | top-level `permissions: contents: read` |
| `.github/workflows/playwright-visual-baseline-update.yml` | top-level `permissions: contents: read`; job-level write override preserved |
| `.github/workflows/playwright-visual-full.yml` | top-level `permissions: contents: read`; job-level pull-request override preserved |
| `.github/workflows/validate-build.yml` | top-level `permissions: contents: read` |
| `.github/workflows/verify-design-tokens.yml` | top-level `permissions: contents: read` |
| `.github/workflows/verify-esbuild.yml` | top-level `permissions: contents: read` |
| `.github/workflows/verify-primitive-adoption.yml` | top-level `permissions: contents: read` |
| `.github/workflows/web-cd.yml` | top-level `permissions: contents: read`; job-level permissions preserved |
| `.github/workflows/ci.yml` | verifier step added after actionlint |
| `scripts/verify-workflow-top-level-permissions.sh` | repository-wide top-level permissions guard |

## Evidence

- `bash scripts/verify-workflow-top-level-permissions.sh`: PASS
- required context diff grep: PASS
- group-B deletion grep: PASS
- `./actionlint -color .github/workflows/*.yml`: PASS

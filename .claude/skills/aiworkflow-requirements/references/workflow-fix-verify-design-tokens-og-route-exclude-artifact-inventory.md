# workflow-fix-verify-design-tokens-og-route-exclude artifact inventory

## Workflow

| Field | Value |
| --- | --- |
| root | `docs/30-workflows/completed-tasks/fix-verify-design-tokens-og-route-exclude/` |
| status | `implemented-local / implementation / NON_VISUAL / local-evidence-captured` |
| upstream | Issue #806 dynamic member OG image / task-18 `verify-design-tokens` |
| user gate | commit, push, PR, GitHub Actions PR checks |

## Implementation Targets

- `scripts/verify-design-tokens.ts`
- `scripts/verify-design-tokens.spec.ts`

## Evidence

- `outputs/phase-11/verify-tokens-local.txt`
- `outputs/phase-11/vitest-verify-design-tokens.txt`
- `outputs/phase-11/drift-canary-fail.txt`
- `outputs/phase-11/canary-non-og-route.txt`

## Phase 12 Strict Outputs

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## Boundary

The local verifier and focused tests are complete. PR checks are not captured until the user authorizes commit, push, and PR creation.

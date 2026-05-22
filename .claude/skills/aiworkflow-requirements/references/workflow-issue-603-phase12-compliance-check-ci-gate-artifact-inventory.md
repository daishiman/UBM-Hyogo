# Workflow Artifact Inventory: Issue #603 phase-12 compliance-check CI gate

| Field | Value |
| --- | --- |
| workflow | `docs/30-workflows/issue-603-phase12-compliance-check-ci-gate/` |
| status | implemented_local_runtime_pending / implementation / NON_VISUAL |
| issue | Issue #603 CLOSED; PR wording uses `Refs #603` |
| source unassigned | `docs/30-workflows/unassigned-task/task-spec-skill-compliance-check-ci-gate.md` consumed/promoted |

## Canonical Artifacts

| Path | Role |
| --- | --- |
| `scripts/verify-phase12-compliance.ts` | CLI entrypoint |
| `scripts/lib/phase12-compliance/collect-changed-roots.ts` | changed workflow root collection |
| `scripts/lib/phase12-compliance/load-canonical-headings.ts` | Required Sections parser and drift gate |
| `scripts/lib/phase12-compliance/verify-compliance-file.ts` | per-root compliance check |
| `scripts/__tests__/verify-phase12-compliance.test.ts` | focused tests |
| `scripts/__tests__/fixtures/phase12-compliance/` | pass/fail fixtures |
| `package.json#scripts.test:phase12-compliance` | focused test script used by CI |
| `package.json#scripts.verify:phase12-compliance` | local verifier script used by CI |
| `.github/workflows/verify-phase12-compliance.yml` | PR CI gate |
| `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` | canonical heading SSOT |
| `docs/30-workflows/issue-603-phase12-compliance-check-ci-gate/outputs/phase-12/` | strict 7 Phase 12 outputs |

## Boundaries

Local verification is in this wave. Commit, push, PR creation, and GitHub-hosted CI log capture are user-gated.

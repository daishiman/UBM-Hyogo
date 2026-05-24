# UT-DSF-07 Staging Visual Runtime Evidence Artifact Inventory

## Metadata

| Item | Value |
| --- | --- |
| Workflow | `docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence/` |
| Status | `spec_created / implementation / VISUAL / runtime_pending` |
| Source issue | #829 CLOSED (`Refs #829` only) |
| Source task | `docs/30-workflows/unassigned-task/UT-DSF-07-visual-runtime-production-equivalent-screenshots.md` consumed |
| Parent | `docs/30-workflows/ui-prototype-design-system-foundation/` |

## Workflow Artifacts

| Artifact | Purpose |
| --- | --- |
| `index.md` | Canonical issue optimization and SSOT order. |
| `artifacts.json` | Gate metadata, output list, expected runtime screenshot list. |
| `phase-01-requirements.md` .. `phase-13-commit-pr-draft.md` | Phase 1-13 executable specification. |
| `outputs/phase-11/main.md` | Runtime evidence boundary index. |
| `outputs/phase-11/manual-test-result.md` | Spec walkthrough evidence. |
| `outputs/phase-11/screenshot-plan.json` | Four screenshot capture contract. |
| `outputs/phase-11/phase11-capture-metadata.json` | Required evidence metadata contract. |
| `outputs/phase-12/*.md` | Strict Phase 12 output set. |

## Implementation Targets

| Target | Intended change |
| --- | --- |
| `apps/web/playwright.config.ts` | Add staging visual project without disrupting local visual baseline. |
| `apps/web/playwright/tests/visual-staging/*.spec.ts` | Capture public-top, login, profile, and admin-dashboard against Cloudflare Workers staging. |
| `apps/web/package.json` | Add an explicit staging visual script if needed. |
| `docs/30-workflows/ui-prototype-design-system-foundation/{index.md,artifacts.json}` | Release `VISUAL_RUNTIME_PENDING` only after real runtime evidence exists. |

## Boundary

No new API endpoint, D1 schema, Google Form contract, or production deploy is part of the spec package. Staging deploy, screenshot capture, parent gate release, commit, push, and PR remain user-gated execution steps.

# Workflow Artifact Inventory: admin-schema-history-purpose-clarity-and-filter-fix

## Canonical Root

`docs/30-workflows/completed-tasks/admin-schema-history-purpose-clarity-and-filter-fix/`

## State

`implemented_local_evidence_captured / implementation / VISUAL / staging_visual_pending_user_gate`

## Workflow Artifacts

| Path | Role |
|---|---|
| `index.md` | Human-readable workflow entry |
| `artifacts.json` | Machine-readable task state |
| `outputs/artifacts.json` | Root artifacts mirror |
| `shared-context.md` | SSOT |
| `phase-1-requirements.md` ... `phase-13-pr.md` | Phase specs |
| `outputs/phase-11/manual-test-result.md` | local command evidence + local screenshot evidence + staging screenshot pending inventory |
| `outputs/phase-11/screenshots/admin-schema-history-purpose-and-card.png` | local purpose explainer + card layout screenshot |
| `outputs/phase-11/screenshots/admin-schema-history-error-message.png` | local human-readable error screenshot |
| `outputs/phase-12/main.md` | Phase 12 summary |
| `outputs/phase-12/implementation-guide.md` | Junior + technical implementation guide |
| `outputs/phase-12/system-spec-update-summary.md` | Same-wave spec sync summary |
| `outputs/phase-12/documentation-changelog.md` | Documentation changelog |
| `outputs/phase-12/unassigned-task-detection.md` | baseline M-1/M-2 separation |
| `outputs/phase-12/skill-feedback-report.md` | Skill compliance report |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | Canonical Phase 12 compliance check |

## Implementation Boundary

| Path | Role |
|---|---|
| `apps/web/src/lib/admin/api.ts` | `AppliedFiltersZ` / `defaultAppliedFilters()` accept `batchId` |
| `apps/web/src/lib/admin/schemaHistoryError.ts` | human-readable schema history error formatter |
| `apps/web/src/lib/admin/schemaHistoryGlossary.ts` | purpose steps + glossary data |
| `apps/web/src/components/admin/SchemaHistoryPurposeExplainer.tsx` | purpose explainer UI |
| `apps/web/src/components/admin/SchemaDiffHistoryPanel.tsx` | explainer integration, formatter usage, card history list |
| `apps/web/app/(admin)/admin/schema/history/page.tsx` | page title / description |
| `apps/web/src/styles/globals.css` | token-only `.schema-history-*` styles |
| `apps/web/src/lib/admin/__tests__/api.spec.ts` | batchId parse regression |
| `apps/web/src/lib/admin/__tests__/schemaHistoryError.spec.ts` | formatter regression |
| `apps/web/src/components/admin/__tests__/SchemaHistoryPurposeExplainer.component.spec.tsx` | explainer regression |
| `apps/web/src/components/admin/__tests__/SchemaDiffHistoryPanel.component.spec.tsx` | panel card/error/explainer regression |
| `apps/web/playwright/tests/admin-schema-history-purpose-clarity.spec.ts` | local visual evidence regression |

## Evidence

| Command | Result |
|---|---|
| `pnpm exec vitest run --config=vitest.config.ts apps/web/src/lib/admin/__tests__/api.spec.ts apps/web/src/lib/admin/__tests__/schemaHistoryError.spec.ts apps/web/src/components/admin/__tests__/SchemaDiffHistoryPanel.component.spec.tsx apps/web/src/components/admin/__tests__/SchemaHistoryPurposeExplainer.component.spec.tsx` | PASS（4 files / 60 tests） |
| `PLAYWRIGHT_SKIP_WEB_SERVER=1 PLAYWRIGHT_BASE_URL=http://localhost:3100 PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/admin-schema-history-purpose-clarity-and-filter-fix/outputs/phase-11 pnpm --dir apps/web exec playwright test playwright/tests/admin-schema-history-purpose-clarity.spec.ts --project=desktop-chromium` | PASS（2 tests / local screenshots 2 PNG） |
| `pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| `pnpm verify:tokens` | PASS（design tokens in sync / 91 tracked） |
| `git diff origin/dev...HEAD -- apps/api apps/api/migrations` | PASS（empty） |

## Invariants

- Existing `GET /admin/audit?action=schema_diff.alias_assigned` only.
- `apps/api/**`, D1 migrations, and Google Form schema unchanged.
- `batchId` is accepted in web adapter response parsing; no batchId filter UI is added.
- M-1 glossary future consolidation and M-2 shared type extraction remain baseline future candidates, not same-cycle fixes.

## User Gate

Staging deploy, authenticated screenshots (`admin-schema-history-purpose-and-card.png`, `admin-schema-history-error-message.png`), commit, push, and PR remain user-gated. Local screenshots are present under the Phase 11 canonical screenshot directory.

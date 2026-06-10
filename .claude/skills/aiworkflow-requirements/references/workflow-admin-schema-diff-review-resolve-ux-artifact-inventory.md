# Workflow Artifact Inventory: admin-schema-diff-review-resolve-ux

## Summary

- workflow root: `docs/30-workflows/completed-tasks/admin-schema-diff-review-resolve-ux/`
- status: `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION / staging_visual_pending_user_gate`
- purpose: Make `/admin/schema` diff-review and stableKey alias assignment understandable by moving the assign form inline under the clicked diff card, adding page-level purpose guidance, and showing plain Japanese labels with technical names.

## Implementation Targets

| Area | Files |
| --- | --- |
| terms SSOT | `apps/web/src/components/admin/schemaReviewTerms.ts` |
| guide component | `apps/web/src/components/admin/SchemaReviewGuide.tsx` |
| diff panel UX | `apps/web/src/components/admin/SchemaDiffPanel.tsx` |
| route integration | `apps/web/app/(admin)/admin/schema/page.tsx` |
| styles | `apps/web/src/styles/globals.css` |
| tests | `apps/web/src/components/admin/__tests__/schemaReviewTerms.spec.ts`, `SchemaReviewGuide.spec.tsx`, `SchemaDiffPanel.component.spec.tsx` |

## Evidence

| Check | Result |
| --- | --- |
| focused Vitest | PASS: 3 files / 36 tests |
| web typecheck | PASS: `pnpm --filter @ubm-hyogo/web typecheck` |
| design tokens | PASS: `pnpm --filter @ubm-hyogo/web verify-design-tokens` |
| apps/api non-touch | PASS: `git diff --quiet -- apps/api` exit 0 |

## Invariants

- `apps/api` / D1 schema / Google Form / endpoint surface unchanged.
- Existing `POST /admin/schema/aliases`, bulk resolve, rollback, undo, recompute, and HTTP 202 retryable behavior unchanged.
- `aria-label="stableKey alias 割当"` and machine-readable bulk/rollback ids remain stable.
- Staging screenshots, commit, push, and PR remain user-gated.

## Lessons

- Implementation workflows with a clear apps target must not close at `spec_created`; local code and focused evidence should be captured in the same cycle.
- Plain-language glossary data is cheaper and more stable than scattering one-off explanations through a large panel component.

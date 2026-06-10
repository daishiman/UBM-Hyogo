# Manual Test Result

| Item | Value |
| --- | --- |
| workflow_id | `public-members-tag-filter-ux-refine` |
| status | `implemented_local_runtime_pending` |
| checked_at | `2026-06-08` |

## Local Evidence

| Check | Result |
| --- | --- |
| Focused Vitest | PASS: 5 files / 28 tests |
| Web typecheck | PASS: `pnpm --filter @ubm-hyogo/web typecheck` |
| Web lint | PASS: `pnpm --filter @ubm-hyogo/web lint` |
| Token gate | PASS: `pnpm verify:tokens` |

## Runtime Visual

Staging screenshots are pending user approval. The local implementation and DOM/CSS contract are present; runtime screenshot capture remains Gate-C.
| TC-ID | Status | スクリーンショット |
| --- | --- | --- |
| TC-1 | present | `outputs/phase-11/screenshots/public-members-tag-filter-horizontal.png` |
| TC-2 | present | `outputs/phase-11/screenshots/public-members-filter-region-grouped.png` |
| TC-3 | present | `outputs/phase-11/screenshots/public-members-grid-spacing.png` |
| TC-4 | present | `outputs/phase-11/screenshots/public-members-mobile-filter-tags.png` |
| TC-5 | present | `outputs/phase-11/screenshots/public-members-tags-selected.png` |

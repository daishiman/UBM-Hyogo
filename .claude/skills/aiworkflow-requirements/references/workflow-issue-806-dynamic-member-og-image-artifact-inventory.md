# workflow-issue-806-dynamic-member-og-image artifact inventory

## Workflow

| Field | Value |
| --- | --- |
| root | `docs/30-workflows/issue-806-dynamic-member-og-image/` |
| status | `implemented-local / implementation / VISUAL / local-evidence-captured` |
| issue | #806 CLOSED; PR wording must use `Refs #806` only |
| parent | `docs/30-workflows/completed-tasks/issue-274-public-pages-ogp-sitemap-robots/` |
| source trace | `docs/30-workflows/unassigned-task/task-issue-274-followup-001-dynamic-member-og-image.md` |

## Implementation Targets

- `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx`
- `apps/web/app/(public)/members/[id]/page.tsx`
- `apps/web/src/lib/seo/site-metadata.ts`
- `apps/web/playwright/tests/public-metadata.spec.ts`
- `apps/web/app/(public)/members/[id]/__tests__/opengraph-image.spec.tsx`

## Evidence Boundary

This inventory records local implementation and local visual evidence. Commit, push, PR, deploy verification, production crawler check, and Issue mutation remain user-gated.

## Required Runtime Evidence

- `outputs/phase-11/manual-test-result.md`
- `outputs/phase-11/manual-smoke-log.md`
- `outputs/phase-11/screenshots/og-image-seeded.png`
- `outputs/phase-11/screenshots/og-image-meta-grep.txt`

## Phase 12 Strict Outputs

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

# workflow-issue-274-public-pages-ogp-sitemap-robots artifact inventory

## Workflow
| Field | Value |
| --- | --- |
| root | `docs/30-workflows/issue-274-public-pages-ogp-sitemap-robots/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL / Phase 13 blocked_pending_user_approval` |
| issue | #274 |
| source tasks | `task-06a-followup-002-ogp-sitemap.md`, `task-11-followup-002-public-og-sitemap-robots.md` |

## Implementation Targets
- `apps/web/src/lib/seo/site-metadata.ts`
- `apps/web/app/sitemap.ts`
- `apps/web/app/robots.ts`
- `apps/web/app/opengraph-image.tsx`
- `apps/web/app/layout.tsx`
- `apps/web/app/page.tsx`
- `apps/web/app/(public)/members/page.tsx`
- `apps/web/app/(public)/members/[id]/page.tsx`
- `apps/web/app/(public)/register/page.tsx`
- `apps/web/src/lib/seo/__tests__/site-metadata.spec.ts`
- `apps/web/playwright/tests/public-metadata.spec.ts`

## Evidence Boundary
Local implementation evidence is captured under `outputs/phase-11/`. Commit, push, PR, deployed production verification, and Issue mutation remain user-gated.

## Captured Evidence
- `outputs/phase-11/evidence/typecheck.log`
- `outputs/phase-11/evidence/lint.log`
- `outputs/phase-11/evidence/test.log`
- `outputs/phase-11/evidence/build.log`
- `outputs/phase-11/evidence/grep-gate.log`
- `outputs/phase-11/evidence/curl-sitemap.xml`
- `outputs/phase-11/evidence/curl-robots.txt`
- `outputs/phase-11/evidence/playwright-smoke.log`
- `outputs/phase-11/screenshots/og-image.png`

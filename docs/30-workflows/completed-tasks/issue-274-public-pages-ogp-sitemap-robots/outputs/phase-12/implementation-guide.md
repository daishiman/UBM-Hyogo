# Implementation Guide

## Boundary
This workflow is `implemented_local_evidence_captured / implementation / VISUAL`. The app targets and Phase 11 evidence exist. Commit, push, PR, deployed production verification, and Issue mutation remain user-gated.

## Implementation Order
1. Review `apps/web/src/lib/seo/site-metadata.ts`.
2. Review `apps/web/app/sitemap.ts` and `apps/web/app/robots.ts`.
3. Review `apps/web/app/opengraph-image.tsx`.
4. Review root and public page metadata.
5. Review helper unit tests and Playwright smoke.
6. Use Phase 11 evidence when writing the PR body.

## Evidence References
- `outputs/phase-11/evidence/playwright-smoke.log`
- `outputs/phase-11/evidence/build.log`
- `outputs/phase-11/screenshots/og-image.png`

## User Gates
Commit, push, PR, deployed production verification, and Issue closure remain user-gated.

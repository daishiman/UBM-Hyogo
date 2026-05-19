# Phase 2 Output: 設計

## Summary
- Status: `completed`
- Output boundary: design only. No app code or runtime evidence is claimed.

## Key Decisions
- `apps/web/src/lib/seo/site-metadata.ts` is the SSOT for site URL, site copy, base metadata, and page metadata helper.
- Metadata routes are limited to `sitemap.ts`, `robots.ts`, and root `opengraph-image.tsx`.
- Per-page metadata is added only for the public routes listed in Phase 1.

## Dependencies
- Phase 3 consumes the helper signatures and route contracts from `phase-02.md`.
- Phase 4 consumes the file placement list from `phase-02.md`.
- Phase 8, Phase 10, Phase 11, Phase 12, and Phase 13 consume the same file placement and evidence contracts.


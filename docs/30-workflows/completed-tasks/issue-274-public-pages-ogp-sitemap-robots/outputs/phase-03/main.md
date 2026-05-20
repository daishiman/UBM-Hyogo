# Phase 3 Output: データ / 型契約

## Summary
- Status: `completed`
- Output boundary: type contract only. No app code or runtime evidence is claimed.

## Key Decisions
- `Metadata` and `MetadataRoute` from Next.js remain the only metadata route type sources.
- `/public/members?limit=100&page=N` is the sitemap dynamic source.
- Pagination must continue until `pagination.hasNext === false`.
- Public list items expose top-level `memberId` / `fullName`; they do not expose `summary.fullName` or per-member `updatedAt`.
- Fetch failures degrade to static sitemap entries.

## Dependencies
- Phase 4 and implementation Phases 6-8 consume these type contracts.

# Phase 5: 実装

## Change Manifest

| File | Change |
| --- | --- |
| `packages/shared/src/schemas/admin/tag-queue-resolve.ts` | canonical strict discriminated union schema |
| `packages/shared/src/schemas/admin/index.ts` | admin schema export |
| `packages/shared/src/schemas/index.ts` | schema export root |
| `packages/shared/src/index.ts` | public export |
| `apps/api/src/schemas/tagQueueResolve.ts` | backward-compatible alias to shared schema |
| `apps/api/src/routes/admin/tags-queue.ts` | shared schema import and stable validation error body |
| `apps/web/src/lib/admin/api.ts` | shared `TagQueueResolveBody` import |
| `packages/shared/src/schemas/admin/tag-queue-resolve.test.ts` | schema unit tests |
| `apps/api/src/routes/admin/tags-queue.test.ts` | route contract assertions |

## Implementation Notes

- Mixed bodies such as `{ action:"confirmed", tagCodes:["x"], reason:"x" }` are rejected via `.strict()`.
- API validation failures now return `{ ok:false, error:"validation_error", details:[...] }`.
- Existing `TagQueueResolveBody` import path in apps/api remains available through aliasing.
- apps/web still has no D1 access and no direct tag mutation endpoint.


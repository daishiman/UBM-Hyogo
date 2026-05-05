# Ownership Declaration

| Area | Owner | Rule |
| --- | --- | --- |
| `apps/api/src/repository/_shared/builder.ts` | This task | Exclusive edit scope for resolver injection and old fallback removal |
| `apps/api/src/repository/_shared/metadata.ts` | This task | New resolver interface and default implementation |
| 03a alias queue writer | 03a | This task consumes the interface only |
| 04a / 04b views | 04a / 04b | This task verifies resolver output compatibility |


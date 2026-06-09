# Implementation Guide — Admin Tag Catalog Lifecycle UI

`[実装区分: 実装仕様書]` / status: `completed`

## Concept

`/admin/tags` is the tag assignment queue. It is not the tag master screen. This workflow adds `/admin/tags/catalog` as the tag master catalog screen.

## Implementation

| File | Role |
| --- | --- |
| `apps/web/app/(admin)/admin/tags/catalog/page.tsx` | Server page, `safeServerFetch<TagCatalogListView>("/admin/tags?...")`, `AdminPageHeader`, error degrade |
| `apps/web/src/components/admin/TagCatalogPanel.tsx` | Client list/search/pagination/lifecycle mutation state machine |
| `apps/web/src/components/admin/TagCatalogRow.tsx` | Presentational row with active/inactive status and lifecycle actions |
| `apps/web/src/components/admin/tagCatalogLifecycle.ts` | Pure descriptors, list updates, `FetchAuthedError` parser |
| `apps/web/src/components/shell/shell-config.ts` | `tag-catalog` nav and `/admin/tags` active collision guard |
| `apps/web/src/components/shell/icons.tsx` | shell icon |
| `apps/web/src/styles/globals.css` | `.tag-catalog-*` styles |

## Lifecycle Behavior

| Operation | UI | Endpoint | Result |
| --- | --- | --- | --- |
| reactivate | inactive row: `棚に戻す` | `POST /api/admin/tags/:tagId/reactivate` | row becomes active |
| logical delete | active row: `しまう` | `DELETE /api/admin/tags/:tagId` | row becomes inactive |
| physical delete | all rows: `完全削除` with `ConfirmDialog isDestructive` | `DELETE /api/admin/tags/:tagId/physical` | row is removed on 204 |

409 `tag_has_references` is shown inline as `N人に使用中のため削除不可`. 404 `tag_not_found` is shown as a recoverable row error. Non-JSON 409 is treated as a generic HTTP error, not as a reference-count result.

## Verification

- focused Vitest component/pure/nav suite PASS.
- `@ubm-hyogo/web` typecheck PASS.
- Local static visual screenshots:
  - `outputs/phase-11/screenshots/admin-tag-catalog-local-static-desktop.png`
  - `outputs/phase-11/screenshots/admin-tag-catalog-local-static-mobile-overview.png`
- Authenticated runtime/staging screenshots remain user-gated.

## Invariants

- apps/api endpoints unchanged.
- D1 schema unchanged.
- Google Form unchanged.
- Existing `/admin/tags` queue and tag pickers remain additive/non-regressed.

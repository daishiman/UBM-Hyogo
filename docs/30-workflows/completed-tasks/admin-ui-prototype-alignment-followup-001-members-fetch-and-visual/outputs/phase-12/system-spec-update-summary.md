# System spec update summary

| Target | Update |
|--------|--------|
| `docs/00-getting-started-manual/specs/00-overview.md` | no-op（高レベル overview 変更なし） |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | no-op（既存 endpoint surface のみ利用） |
| `docs/00-getting-started-manual/specs/design-tokens.md` | no-op（既存 OKLch tokens のみ使用） |
| `packages/shared/src/types/viewmodel/index.ts` / `packages/shared/src/zod/viewmodel.ts` | `AdminMemberListItem` に additive optional field（`occupation` / `ubmZone` / `ubmMembershipType` / `tags` / `updatedAt`） |
| `apps/api/src/routes/admin/members.ts` | 既存 `GET /admin/members` で `answers_json` + `member_tags` 由来の prototype list fields を additive に返す |
| `apps/web/app/api/admin/[...path]/route.ts` | `INTERNAL_API_BASE_URL` fallback を staging/production で fail-fast 化し、401/403/404 を mask せず passthrough |
| `apps/web/src/features/admin/adapters/members-view-model.ts` | 新規 adapter |
| `apps/web/src/features/admin/components/_members/*` | プロトタイプ準拠化 |
| `apps/web/src/components/ui/{Avatar,Chip,PillNav}.tsx` | additive のみ拡張、不足時のみ新規 |
| `apps/api/wrangler.toml` | no-op（D1 binding 変更なし） |

破壊的変更なし。既存 consumer は継続動作可能。

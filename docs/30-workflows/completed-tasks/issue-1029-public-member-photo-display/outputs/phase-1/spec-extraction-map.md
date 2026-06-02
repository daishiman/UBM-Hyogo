# Phase 1: spec ↔ current code anchor 1:1 マップ

> system spec / 設計意図と、current code anchor（実ファイル:行）の 1:1 対応を記録する。
> 未実装の将来契約は current baseline と分離して記述する。

## current code anchor（4 系統 + 拡張）

| 系統 | current anchor | 役割 |
|------|----------------|------|
| route owner（list） | `apps/api/src/routes/public/members.ts` | `GET /public/members`。現状 `MembersEnv = { DB }` のみ |
| route owner（profile） | `apps/api/src/routes/public/member-profile.ts` | `GET /public/members/:memberId`。現状 `MemberProfileEnv = { DB }` |
| use-case（list） | `apps/api/src/use-cases/public/list-public-members.ts` | repo → source 組成 → `toPublicMemberListView` parse |
| use-case（profile） | `apps/api/src/use-cases/public/get-public-member-profile.ts` | repo → source 組成 → `toPublicMemberProfileView` parse |
| 状態 owner（公開 gate） | `apps/api/src/repository/publicMembers.ts:37-42` | `public_consent='consented' AND publish_state='public' AND is_deleted=0 AND not alias` |
| 対象 view schema | `packages/shared/src/zod/viewmodel.ts:117-125`（list item）/ `:159-174`（profile） | `.strict()` zod。photoUrl 未定義 |
| 対象 UI（list） | `apps/web/src/components/public/MemberCard.tsx:34,40` | `<Avatar>` に src 未指定 |
| 対象 UI（detail） | `apps/web/src/components/public/ProfileHero.tsx:18` / `MemberDetail.tsx` | `<Avatar>` に src 未指定 |
| UI adapter | `apps/web/src/lib/adapters/member-detail.ts:88-95` | `MemberDetailProps` に photoUrl 無し |

## 再利用 anchor（#983 landed）

| 資産 | anchor | 性質 |
|------|--------|------|
| presign | `apps/api/src/lib/r2/member-photo-presign.ts` `presignMemberPhotoGetUrl` | 純粋関数・deps 不正/失敗時 null（fail-soft） |
| photo 取得 | `apps/api/src/repository/memberPhotos.ts` `getMemberPhoto` | 単体取得（profile 用） |
| bucket 名解決 | `apps/api/src/routes/admin/members.ts:289-318` `resolvePhotoUrl` | `ubm-hyogo-member-photos-{prod,staging}` 解決パターン |
| Avatar 描画 | `apps/web/src/components/ui/Avatar.tsx:25-45` | `src && !imgFailed` → `<img onError>`、else hue placeholder |
| admin schema 先例 | `packages/shared/src/zod/viewmodel.ts:311-313` | `AdminMemberDetailViewZ.photoUrl: z.string().url().optional()` + `.strict()` |

## Phase 1 baseline gap（Phase 5 で実装、Phase 12 で close-out 済み）

| 契約 | 状態 | 配置 Phase |
|------|------|-----------|
| `PublicMemberListItemZ.photoUrl?` / `PublicMemberProfileZ.photoUrl?` | Phase 1 時点の gap。Phase 5 で実装済み | Phase 5 |
| `listMemberPhotosByIds(c, memberIds): Promise<Map<string,string>>` | Phase 1 時点の gap。Phase 5 で実装済み | Phase 5 |
| public route の R2 env 配線 + presign resolver DI | Phase 1 時点の gap。Phase 5 で実装済み | Phase 5 |
| `MemberCard` / `ProfileHero` / adapter の `photoUrl` 配線 | Phase 1 時点の gap。Phase 5 で実装済み | Phase 5 |

> 上記はいずれも Phase 1 の current baseline には存在しなかった。Phase 12 close-out では `implemented_local_runtime_pending` として実装済み状態へ昇格済み。placeholder 名（`previousView` 等）は使用しない。

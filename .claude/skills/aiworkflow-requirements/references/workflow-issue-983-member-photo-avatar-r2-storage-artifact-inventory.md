# Artifact Inventory — issue-983-member-photo-avatar-r2-storage

| Item | Path |
|---|---|
| workflow root | `docs/30-workflows/issue-983-member-photo-avatar-r2-storage/` |
| root index | `docs/30-workflows/issue-983-member-photo-avatar-r2-storage/index.md` |
| root artifacts | `docs/30-workflows/issue-983-member-photo-avatar-r2-storage/artifacts.json` |
| output artifacts mirror | `docs/30-workflows/issue-983-member-photo-avatar-r2-storage/outputs/artifacts.json` |
| Phase 11 boundary | `docs/30-workflows/issue-983-member-photo-avatar-r2-storage/outputs/phase-11/main.md` |
| Phase 12 compliance | `docs/30-workflows/issue-983-member-photo-avatar-r2-storage/outputs/phase-12/phase12-task-spec-compliance-check.md` |

## State

`implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION`.

## Implemented Local Targets

| Area | Targets |
|---|---|
| API/storage | `apps/api/migrations/0022_member_photos.sql`, `apps/api/src/lib/r2/member-photo-presign.ts`, `apps/api/src/repository/memberPhotos.ts`, `apps/api/src/routes/admin/members.ts`, `apps/api/wrangler.toml`, `apps/api/src/env.ts` |
| shared | `packages/shared/src/zod/viewmodel.ts`, `packages/shared/src/types/viewmodel/index.ts` |
| web | `apps/web/src/components/ui/Avatar.tsx`, `apps/web/src/features/admin/components/_members/MemberAvatar.tsx`, `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` |
| tests | presign unit, admin route contract, shared viewmodel spec, MemberAvatar spec |
| visual evidence | `docs/30-workflows/issue-983-member-photo-avatar-r2-storage/outputs/phase-11/screenshots/*.png` |

## User-Gated Operations

R2 bucket creation, R2 presign secret injection, remote D1 migration apply, staging deploy, authenticated staging screenshots, commit, push, PR creation, and Issue #983 state mutation.

## Lessons Learned

詳細: [`lessons-learned/lessons-learned-issue-983-member-photo-avatar-r2-storage-2026-05.md`](../lessons-learned/lessons-learned-issue-983-member-photo-avatar-r2-storage-2026-05.md)

| ID | 要約 |
|---|---|
| L-I983-001 | Form schema 外の admin-managed binary asset は D1メタ + R2バイナリ + presigned URL の3層で分離し、apps/web は signed URL のみ受領（不変条件 #4/#5）。 |
| L-I983-002 | presign は fail-soft（null返却）。read endpoint は presign失敗でも 200 を維持し photoUrl を省略、secret 未設定環境を壊さない。 |
| L-I983-003 | photoUrl 解決は route 層の `resolvePhotoUrl` helper で行い、builder を外部 I/O 非依存に保ち後段マージする層分離。 |
| L-I983-004 | aws4fetch `AwsClient` `signQuery` presigned GET の object key encode（`%2F`→`/`）と TTL `X-Amz-Expires` query 契約。 |
| L-I983-005 | multipart upload は 404→400→415→400→413 の検証順序で正しい HTTP ステータスを返す契約。 |
| L-I983-006 | shared zod に optional `photoUrl` 追加時も `.strict()` 維持 + Avatar `onError` で親タスクの hue-placeholder を fallback 保持。 |

# Workflow Artifact Inventory: issue-1031-member-self-photo-upload

## Canonical

| Item | Path |
| --- | --- |
| workflow root | `docs/30-workflows/issue-1031-member-self-photo-upload/` |
| root artifacts | `docs/30-workflows/issue-1031-member-self-photo-upload/artifacts.json` |
| output artifacts | `docs/30-workflows/issue-1031-member-self-photo-upload/outputs/artifacts.json` |
| Phase 12 compliance | `docs/30-workflows/issue-1031-member-self-photo-upload/outputs/phase-12/phase12-task-spec-compliance-check.md` |

## State

`implemented_local_runtime_pending / implementation / VISUAL`

## Implemented Local Targets

- `apps/api/migrations/0023_member_photos_source.sql`
- `apps/api/src/repository/memberPhotos.ts`
- `apps/api/src/routes/admin/members.ts`
- `apps/api/src/routes/me/index.ts`
- `apps/api/src/routes/me/schemas.ts`
- `apps/web/app/api/me/photo/route.ts`
- `apps/web/src/lib/api/me-photo-client.ts`
- `apps/web/app/(member)/profile/_components/PhotoUpload.client.tsx`
- `apps/web/app/(member)/profile/page.tsx`
- `apps/web/src/lib/api/me-types.ts`

## Verification Boundary

Focused local tests, Phase 11 component-isolation screenshot evidence, and Phase 12 strict 7 files are present. Remote D1 migration apply, staging deploy, authenticated member-session runtime screenshot, commit, push, PR, and Issue mutation remain user-gated.

## Lessons

参照: [lessons-learned-issue-1031-member-self-photo-upload-2026-06.md](../lessons-learned/lessons-learned-issue-1031-member-self-photo-upload-2026-06.md)（L-I1031-001..008）

- L-I1031-001: `member_photos.source` は additive migration、値域正規化は repository read-time（`"self"` 以外は `admin`）
- L-I1031-002: `/me/photo` は path に memberId を出さず `session.user.memberId` のみ（invariant #11 fail-closed）
- L-I1031-003: `GET /me/profile.photoUrl` は presign 失敗・secret 不足で `undefined` を返す fail-soft（200 維持）
- L-I1031-004: multipart 検証順序を固定し status code（400/415/413/503/429）を contract test 化
- L-I1031-005: 同意ゲートは `POST` 限定、`DELETE` は付けない（撤去意図優先・row 不在 404）
- L-I1031-006: Client Component のロック解放は success/error 両分岐に置く（try/finally 等価）
- L-I1031-007: OKLch token 遵守（`bg-[var(--ubm-color-...)]` で HEX 直書き回避）
- L-I1031-008: web proxy は `FormData` 再構築で multipart 透過 + env 不変条件遵守

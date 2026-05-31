# Implementation Guide

## Part 1: Concept

The admin member drawer needs a real face photo when one exists, but the Google Form does not collect photos. The simplest complete design is to store admin-managed photos separately: D1 records which member owns a photo, R2 stores the binary file, and the API issues a short-lived URL for the browser image.

## Part 2: Technical Contract

Implemented local vertical slice:

- `member_photos` D1 table for metadata.
- `MEMBER_PHOTOS` R2 binding for private object storage.
- `POST /admin/members/:memberId/photo` and `DELETE /admin/members/:memberId/photo`.
- `GET /admin/members/:memberId` with optional `photoUrl`.
- `AdminMemberDetailViewZ.photoUrl?: string` while preserving `.strict()`.
- `Avatar src?` with `onError` fallback to the existing hue placeholder.
- `MemberDrawer` upload/delete controls via `useAdminMutation`.

Key constants:

| Item | Value |
|---|---|
| object key | `members/{memberId}/avatar` |
| max size | `256 * 1024` bytes |
| MIME | `image/jpeg`, `image/png`, `image/webp` |
| presign TTL | 300 seconds |

Do not expose R2 or D1 access from `apps/web`; the web layer receives only the signed `photoUrl` string.

## Part 3: Evidence

Local static visual screenshots are stored under `../phase-11/screenshots/`:

- `member-avatar-photo.png`
- `member-avatar-placeholder.png`
- `member-drawer-photo-upload.png`
- `member-drawer-photo-deleted.png`
- `member-avatar-upload-loading.png`
- `member-avatar-img-error-fallback.png`

Focused local verification covers presign generation, upload/delete route contract, shared schema strictness, and avatar fallback rendering. Staging runtime verification remains gated by R2 bucket provisioning, presign secrets, remote D1 migration apply, and deploy.

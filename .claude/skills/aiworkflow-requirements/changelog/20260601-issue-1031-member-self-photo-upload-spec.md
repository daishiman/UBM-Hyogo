# 2026-06-01 issue-1031-member-self-photo-upload implementation sync

Registered issue #1031 member self photo upload as `implemented_local_runtime_pending / implementation / VISUAL`.

- Canonical workflow: `docs/30-workflows/issue-1031-member-self-photo-upload/`
- Parent workflow: `docs/30-workflows/issue-983-member-photo-avatar-r2-storage/`
- Implemented contract: `/me/photo` POST/DELETE, `member_photos.source`, `/me/profile photoUrl?`, profile `PhotoUpload.client.tsx`
- Boundary: local tests and component visual evidence are captured; remote D1 apply, staging deploy, authenticated runtime screenshot, commit/push/PR, and issue mutation remain user-gated.
- Lessons: `lessons-learned/lessons-learned-issue-1031-member-self-photo-upload-2026-06.md` (L-I1031-001..008).

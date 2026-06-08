# 2026-06-06 — issue-1118 admin tag catalog lifecycle UI

`issue-1118-admin-tag-catalog-lifecycle-ui` を `implemented_local_evidence_captured / implementation / VISUAL` として同期。

- `/admin/tags` が tag assignment queue であり tag master UI ではない前提 drift を補正し、新規 `/admin/tags/catalog` を追加。
- `GET /admin/tags` と既存 lifecycle mutation（reactivate / logical delete / physical delete）のみを消費。apps/api / D1 schema / Google Form は不変。
- physical delete は `ConfirmDialog` `isDestructive` で不可逆確認し、409 `tag_has_references` は `referenceCount` を「N人に使用中のため削除不可」として表示。
- shell nav に `tag-catalog` を追加し、`/admin/tags/catalog` で `/admin/tags` が active にならない regression test を追加。
- focused Vitest component/pure/nav suite PASS、local static visual PNGs present、`@ubm-hyogo/web` typecheck PASS。
- authenticated runtime/staging screenshot、commit、push、PR は user-gated。

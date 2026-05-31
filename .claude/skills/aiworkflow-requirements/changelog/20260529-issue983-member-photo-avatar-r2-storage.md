# 2026-05-29 issue-983 member photo avatar R2 storage spec sync

Registered `docs/30-workflows/issue-983-member-photo-avatar-r2-storage/` as `implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION`.

Synchronized:

- quick-reference entry
- resource-map entry
- task-workflow-active entry
- artifact inventory
- Phase 11 local static screenshot evidence

Boundary:

- Local implementation code is present in `apps/` and `packages/`.
- R2 bucket creation, R2 presign secrets, remote D1 migration apply, staging deploy, authenticated staging screenshots, commit, push, PR, and Issue #983 mutation remain user-gated.

## Lessons

`lessons-learned/lessons-learned-issue-983-member-photo-avatar-r2-storage-2026-05.md` を新規追加し、artifact inventory に `## Lessons Learned` 節を追記。

- L-I983-001: Form schema 外の admin-managed binary asset は D1メタ + R2バイナリ + presigned URL の3層分離（不変条件 #4/#5）。
- L-I983-002: presign は fail-soft（null返却）、read endpoint は presign失敗でも 200 維持・photoUrl 省略。
- L-I983-003: photoUrl 解決は route 層 `resolvePhotoUrl` helper、builder は外部 I/O 非依存に保ち後段マージ。
- L-I983-004: aws4fetch `AwsClient` `signQuery` presigned GET の key encode / `X-Amz-Expires` TTL 契約。
- L-I983-005: multipart upload の 404→400→415→400→413 検証順序契約。
- L-I983-006: shared zod optional `photoUrl` + `.strict()` 維持、Avatar `onError` で hue-placeholder fallback 保持。

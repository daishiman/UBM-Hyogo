# Phase 5: 実装サマリ（実コード反映）

2026-05-29 に Phase 1-3 設計 / Phase 4-6 テスト計画に基づき、実コードへ実装を完了した。

## task-A（apps/api）

- `repository/memberTags.ts`: `TagRef` 型 + admin manual 経路 6 関数を追加。
  - read: `getTagDefinitionMaster`（active master 全件）/ `listAssignedTagsForMember` / `findTagDefinitionById` / `getMemberDeletedFlag`。
  - write: `assignTagToMemberByAdmin`（`INSERT OR IGNORE`、`meta.changes>0` で true）/ `unassignTagFromMemberByAdmin`（DELETE、冪等）。
  - 冒頭コメントを不変条件 #13 再定義（queue / admin manual の 2 経路）へ更新。
- `routes/admin/members.ts`: `createAdminMembersRoute()` 内に GET/POST/DELETE `/members/:memberId/tags` を追記。
  - POST 処理順: member 存在 → `is_deleted` 409 → tag master 404 → `INSERT OR IGNORE` → `changes>0` のみ audit append → 更新後 `{assigned,available}`。
  - DELETE: member 404 / 409 → DELETE → `changes>0` のみ audit → 204。
  - audit: `c.var.auditLogProvider.append()` で `admin.member.tag_assigned` / `admin.member.tag_unassigned`、`targetType:"member"`、actor = `authUser`。
- `routes/admin/tags-queue.ts`: 不変条件 #13 コメント再定義（task-C と協調・コメントのみ）。
- 型 gate `memberTags.readonly.test-d.ts`: `assignTagToMemberByAdmin` を allow list に追加（`unassign*` は `assign*` 接頭辞外のため allow list 不要）。

## task-B（apps/web）

- `features/admin/api/members.ts`（新規）: `fetchMemberTags` / `assignMemberTag` / `unassignMemberTag` を `/api/admin` proxy 経由で実装（D1 直接アクセスなし）。
- `MemberDrawer.tsx`: `ALL_TAGS` ハードコードを撤去し、`MemberTagsEditor` 子コンポーネントへ分離。
  - drawer open 時に `fetchMemberTags` で `{assigned,available}` を取得（loading/error state あり・本体 drawer はクラッシュしない）。
  - pill click で楽観更新 → `useAdminMutation`（POST/DELETE）発火 → `onError` で `rollbackRef` から復元、`pendingTagId` で二重発火防止。
  - DELETE は `treat404AsSuccess:"silent"`、両 mutation に `idempotencyKey: () => crypto.randomUUID()`。

## task-C（visual + docs）

- `playwright/.../member-drawer-tag-edit.spec.ts`（新規）: drawer の TAGS セクションを screenshot（env-gated・baseline は user-gated）。
- `docs/00-getting-started-manual/specs/01-api-schema.md`: tag write endpoint 3 本 + 不変条件 #13 再定義 + audit action 2 件 + 正本テーブル（`member_tags` / `tag_definitions`）を追記。

## TDD 順序

設計（Phase 1-3）→ テスト（contract / repository / component spec）→ 実コード → green 収束 の順で実施。テストファイルは `*.spec.{ts,tsx}` のみ（不変条件 #8 遵守）。

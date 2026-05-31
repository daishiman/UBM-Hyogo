# task-A — tag write API + repository + audit

[実装区分: 実装仕様書]

`apps/api` に member tag の付与 / 解除 / master 読取を提供する。`member_tags` への admin 直接 write を audit 付きで実装する。

> **実コード照合済み（2026-05-29）**: tag master = `tag_definitions`（`tags` ではない）。member 削除判定 = `member_status.is_deleted`。audit = `auditLogProvider.append()`。冪等性 = PK `INSERT OR IGNORE` / DELETE no-op（API 側 idempotency middleware は未実装。client の `Idempotency-Key` header は現状 server no-op）。

## 変更対象ファイル

| パス | 種別 | 内容 |
| --- | --- | --- |
| `apps/api/src/routes/admin/members.ts` | 編集 | GET/POST/DELETE tag endpoint 3 本を `createAdminMembersRoute()` 内に追記 |
| `apps/api/src/repository/memberTags.ts` | 編集 | admin 付与 / 解除 / master 読取関数を追加 |
| `apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts` | 編集（存在すれば） | 型 gate allowlist に新 write 関数を許可 |
| `apps/api/src/routes/admin/tags-queue.ts` | 編集 | invariant #13 コメントを再定義（task-C と協調・コメントのみ） |
| `apps/api/src/routes/admin/members.tags.contract.spec.ts` | 新規 | route contract spec |
| `apps/api/src/repository/__tests__/memberTags.repository.spec.ts` | 追補 | repository unit spec（既存ファイルに追記） |

## tag 識別子の方針（実コード整合）

- `tag_definitions.tag_id`（PK）を **正本識別子** とし、endpoint の path / body は `tagId` を使う。
- 表示・既存 detail との parity 用に `code`（UNIQUE）も TagRef に含める。
- member detail（`buildAdminMemberDetailView`）の `tags` は `{ code, label, category, source }`。本タスクの TagRef は `{ tagId, code, label, category }` とし、drawer 側の selected 判定は `tagId` で行う。

```ts
type TagRef = { tagId: string; code: string; label: string; category: string };
type MemberTagsResponse = { assigned: TagRef[]; available: TagRef[] };
```

## endpoint シグネチャ

`members.ts` の `createAdminMembersRoute()` 内 Hono app に追記。mount は `apps/api/src/index.ts:257` の `app.route("/admin", adminMembersRoute)`（既存 `GET /members/:memberId` と同居）。`requireAdmin` は admin route 群で適用済み。actor は `c.get("authUser")`（`{ memberId, email, isAdmin }`）。

### GET `/members/:memberId/tags`

- response 200: `MemberTagsResponse`
  - `assigned`: `member_tags` JOIN `tag_definitions`（当該 member）
  - `available`: `tag_definitions WHERE active = 1` 全件（drawer 選択肢。`ALL_TAGS` ハードコード置換のための read 経路新設）
- member 不在 → `404 { ok:false, error:'member_not_found' }`

### POST `/members/:memberId/tags`

- body: `const AssignBodyZ = z.object({ tagId: z.string().min(1) });`（失敗 → `400 { ok:false, error }`）
- 処理順:
  1. member 存在確認（`member_status` or members）→ 不在 404
  2. `member_status.is_deleted === 1` → `409 { ok:false, error:'member_is_deleted' }`（Issue AC-5 準拠。既存 attendance route は同状況で 422 を返すが、本 endpoint は Issue 契約に従い 409 を採用）
  3. active な tag master 存在確認: `tag_definitions WHERE tag_id = ? AND active = 1`（無 / inactive → `404 { ok:false, error:'tag_not_found' }`）
  4. `INSERT OR IGNORE INTO member_tags (member_id, tag_id, source, assigned_by) VALUES (?, ?, 'manual', ?)` → `meta.changes` 取得
  5. `changes > 0`（新規付与）のときのみ audit append
  6. response 200: `MemberTagsResponse`（更新後）
- 冪等: PK `(member_id, tag_id)` の `INSERT OR IGNORE` で再 POST は no-op（200）。`Idempotency-Key` header は受理するが現状 server no-op

### DELETE `/members/:memberId/tags/:tagId`

- 処理順:
  1. member 存在確認 → 不在 404
  2. `is_deleted === 1` → 409 `member_is_deleted`
  3. `DELETE FROM member_tags WHERE member_id = ? AND tag_id = ?` → `meta.changes`
  4. `changes > 0` のときのみ audit append（`admin.member.tag_unassigned`）
  5. response: `204`（未存在でも 204 で冪等）

## audit 呼び出し（実シグネチャ）

`apps/api/src/repository/auditLog.ts` の `append(c, e: NewAuditLogEntry)` を `c.var.auditLogProvider`（`requireProvider(c.var.auditLogProvider, "auditLogProvider")`）経由で呼ぶ。`action` は `auditAction("...")`。

```ts
await requireProvider(c.var.auditLogProvider, "auditLogProvider").append({
  actorId: asAdminId(authUser.memberId),
  actorEmail: adminEmail(authUser.email),
  action: auditAction("admin.member.tag_assigned"),   // DELETE は "admin.member.tag_unassigned"
  targetType: "member" /* or "member_tag" */,
  targetId: memberId,
  before: null,                                         // assign: null / unassign: { tagId }
  after: { tagId, source: "manual" },                  // assign: {tagId,source} / unassign: null
});
```

> **型確認**: `AuditTargetType` union に `"member"` が無い場合は `"member"` を追加するか、既存 union の適切値を使う（Phase 2 で確認）。`auditAction` も union 制約があれば action 文字列を許容するよう拡張する。

## repository 関数（`memberTags.ts`）

```ts
// 既存: assignTagsToMember(...) は tagQueueResolve 専用のまま温存

// 追加（admin manual 経路）
export async function getTagDefinitionMaster(c: DbCtx): Promise<TagRef[]>;          // tag_definitions WHERE active=1
export async function listAssignedTagsForMember(c: DbCtx, memberId: MemberId): Promise<TagRef[]>;
export async function findTagDefinitionById(c: DbCtx, tagId: string): Promise<TagRef | null>;
/** INSERT OR IGNORE。新規付与なら true、既存(no-op)なら false（meta.changes>0） */
export async function assignTagToMemberByAdmin(c: DbCtx, memberId: MemberId, tagId: string, assignedBy: string): Promise<boolean>;
/** 削除行があれば true、無ければ false（冪等。meta.changes>0） */
export async function unassignTagFromMemberByAdmin(c: DbCtx, memberId: MemberId, tagId: string): Promise<boolean>;
/** member_status.is_deleted を返す（member 不在は null） */
export async function getMemberDeletedFlag(c: DbCtx, memberId: MemberId): Promise<boolean | null>;
```

- `source` は固定 `'manual'`、`assigned_by` は actor email。
- `DbCtx` は既存 repository の context 型（`ctx({ DB })`）に合わせる。

### 型 gate 更新

`memberTags.readonly.test-d.ts` が存在し write を `assign*` prefix allowlist 化している場合、`unassignTagFromMemberByAdmin` を **admin manual 例外** として allowlist に明示追加。コメントで invariant #13 再定義に言及。ファイルが無ければ本項目は N/A（Phase 1 で存在確認済みの前提で進める）。

## 入出力 / 副作用

- 入力: path `memberId` / `tagId`、body `{ tagId }`、context `authUser`
- 出力: JSON（GET/POST）/ 204（DELETE）
- 副作用: `member_tags` の INSERT/DELETE、`audit_log` への 1 行（state 変化時のみ）

## テスト方針（task-A 分）

`members.tags.contract.spec.ts`（既存 `members.contract.spec.ts` / `tags-queue.contract.spec.ts` の D1 harness を踏襲）:

| ID | ケース | expected |
| --- | --- | --- |
| A-T1 | POST 新規付与 | 200 + assigned に tagId 含む + audit `admin.member.tag_assigned` 1 件 |
| A-T2 | POST 同一 tag 再送 | 200 + assigned 重複なし + audit 増えない（計 1 件） |
| A-T3 | POST body 不正（tagId 空） | 400 |
| A-T4 | POST tag master 不在 | 404 `tag_not_found` |
| A-T4b | POST inactive tag master | 404 `tag_not_found` + audit 0 |
| A-T5 | POST member 不在 | 404 `member_not_found` |
| A-T6 | POST is_deleted=1 member | 409 `member_is_deleted` |
| A-T7 | DELETE 既存付与 | 204 + assigned から消える + audit `admin.member.tag_unassigned` 1 件 |
| A-T8 | DELETE 未存在付与（冪等） | 204 + audit 増えない |
| A-T9 | DELETE is_deleted=1 member | 409 `member_is_deleted` |
| A-T10 | GET | 200 + `{ assigned, available }` shape |
| A-T11 | regression: 既存 detail `GET /members/:memberId` | `tags` shape `{code,label,category,source}` 不変 |

`memberTags.repository.spec.ts` 追補: `assignTagToMemberByAdmin` の changes 判定、`unassignTagFromMemberByAdmin` 冪等、`getTagDefinitionMaster` / `listAssignedTagsForMember` / `getMemberDeletedFlag` の SELECT 整合。

## ローカル実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- members.tags.contract
mise exec -- pnpm --filter @ubm-hyogo/api test -- memberTags
mise exec -- pnpm typecheck
```

> filter 名は `apps/api/package.json` の `name` で確認して合わせる。

## DoD（task-A）

- A-T1〜A-T11 全 PASS
- repository spec / 型 gate（あれば）green
- `pnpm typecheck` green
- 既存 `members.contract.spec.ts` / `tags-queue.contract.spec.ts` regression 0

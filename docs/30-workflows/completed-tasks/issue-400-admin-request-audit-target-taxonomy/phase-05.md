# Phase 5: 実装手順詳細

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskId | issue-400-admin-request-audit-target-taxonomy |
| phase | 05 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Issue #400 の admin request audit target taxonomy を実装・検証・正本同期する。

## 実行タスク

- Phase 本文の内容を実行し、成果物と検証証跡を同期する。

## 参照資料

- `docs/30-workflows/issue-400-admin-request-audit-target-taxonomy/index.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md`

## 成果物

- root Phase 仕様書と `outputs/phase-*/main.md`


## T1. `AuditTargetType` union 拡張

**ファイル**: `apps/api/src/repository/auditLog.ts:8-13`

**変更前**:

```ts
export type AuditTargetType =
  | "member"
  | "tag_queue"
  | "schema_diff"
  | "meeting"
  | "system";
```

**変更後**:

```ts
export type AuditTargetType =
  | "member"
  | "admin_member_note"
  | "tag_queue"
  | "schema_diff"
  | "meeting"
  | "system";
```

## T2. resolve INSERT の target_type / target_id 切替

**ファイル**: `apps/api/src/routes/admin/requests.ts:352-368`

**変更前**:

```ts
stmts.push(
  c.env.DB.prepare(
    `INSERT INTO audit_log
      (audit_id, actor_id, actor_email, action, target_type, target_id, before_json, after_json, created_at)
     SELECT ?1, NULL, ?2, ?3, 'member', member_id, NULL, ?4, ?5
       FROM admin_member_notes
      WHERE note_id = ?6
        AND request_status = 'pending'`,
  ).bind(
    auditId,
    adminEmail(adminIdRaw),
    auditAction(`admin.request.${resolution}`),
    auditAfter,
    nowIso,
    noteId,
  ),
);
```

**変更後**:

```ts
stmts.push(
  c.env.DB.prepare(
    `INSERT INTO audit_log
      (audit_id, actor_id, actor_email, action, target_type, target_id, before_json, after_json, created_at)
     SELECT ?1, NULL, ?2, ?3, 'admin_member_note', ?6, NULL, ?4, ?5
       FROM admin_member_notes
      WHERE note_id = ?6
        AND request_status = 'pending'`,
  ).bind(
    auditId,
    adminEmail(adminIdRaw),
    auditAction(`admin.request.${resolution}`),
    auditAfter,
    nowIso,
    noteId,
  ),
);
```

**注意**: `target_id` を `member_id`（行依存）から bind 変数 `?6 = noteId` に変更。`after_json` (`auditAfter`) は既に `{ noteId, memberId, noteType, resolution }` を含むので memberId のトレーサビリティは保たれる。

## T3. repository 単体テスト追加

**ファイル**: `apps/api/src/repository/__tests__/auditLog.test.ts`

追加ケース:

```ts
it("append/listByTarget: targetType 'admin_member_note' のラウンドトリップ", async () => {
  const c = await createDbCtx();
  await append(c, {
    actorId: null,
    actorEmail: "owner@example.com" as AdminEmail,
    action: "admin.request.approve" as AuditAction,
    targetType: "admin_member_note",
    targetId: "note-1",
    after: { noteId: "note-1", memberId: "m-1", noteType: "delete_request", resolution: "approve" },
  });
  const rows = await listByTarget(c, "admin_member_note", "note-1", 10);
  expect(rows).toHaveLength(1);
  expect(rows[0]?.targetType).toBe("admin_member_note");
  expect(rows[0]?.targetId).toBe("note-1");
  expect(rows[0]?.after).toMatchObject({ memberId: "m-1" });
});
```

既存 listFiltered 複合 filter ケースに `targetType: "admin_member_note"` の expectation も追加する。

## T4. requests route テスト期待値更新

**ファイル**: `apps/api/src/routes/admin/requests.test.ts:150-160`

変更前 expect:

```ts
expect(audit?.targetType).toBe("member");
```

変更後 expect:

```ts
expect(audit?.targetType).toBe("admin_member_note");
expect(audit?.targetId).toBe(noteId);
const after = audit?.afterJson ? JSON.parse(audit.afterJson) : null;
expect(after).toMatchObject({ memberId: expect.any(String), noteId });
```

`SELECT` 文の取得カラムに `target_id AS targetId` が無い場合は SELECT 句にも追記する。

## T5. audit route filter テスト追加

**ファイル**: `apps/api/src/routes/admin/audit.test.ts`

追加ケース:

```ts
it("targetType=admin_member_note は新規行のみを返し、member 行と分離される", async () => {
  // fixture: 既存仕様の 'member' 行 + 新仕様 'admin_member_note' 行を投入
  await seedAudit(env, [
    { targetType: "member", targetId: "m-legacy", after: { noteId: "n-legacy" } },
    { targetType: "admin_member_note", targetId: "n-new", after: { memberId: "m-new", noteId: "n-new" } },
  ]);

  const r1 = await app.request("/audit?targetType=admin_member_note&limit=10", {}, env);
  const b1 = await r1.json();
  expect(b1.items.map((i) => i.targetType)).toEqual(["admin_member_note"]);

  const r2 = await app.request("/audit?targetType=member&limit=10", {}, env);
  const b2 = await r2.json();
  expect(b2.items.map((i) => i.targetType)).toEqual(["member"]);
});
```

## T6. shared zod コメント追記

**ファイル**: `packages/shared/src/zod/viewmodel.ts:179-188`

`targetType: z.string()` の直前に以下コメントを追記:

```ts
// canonical AuditTargetType 列挙（SSOT: apps/api/src/repository/auditLog.ts AuditTargetType）
//   "member" | "admin_member_note" | "tag_queue" | "schema_diff" | "meeting" | "system"
// 後方互換のため schema は z.string() を維持し、append 時のみ enum 制約を API 側で行う。
targetType: z.string(),
```

## T7. UI placeholder 文言更新

**ファイル**: `apps/web/src/components/admin/AuditLogPanel.tsx:180`

**変更前**:

```tsx
<input name="targetType" defaultValue={values.targetType ?? ""} placeholder="meeting" />
```

**変更後**:

```tsx
<input
  name="targetType"
  defaultValue={values.targetType ?? ""}
  placeholder="meeting | admin_member_note"
/>
```

## T8. UI test placeholder assertion 更新（条件付）

`AuditLogPanel.test.tsx` 内に placeholder 文字列 `"meeting"` を直接 assert している箇所があれば新文言に追従。grep で `placeholder` をヒットさせて存在時のみ修正する。

## T9. docs 同期

- `docs/00-getting-started-manual/specs/` 内で `audit_log` / `target_type` を記述している章があれば `admin_member_note` を追記
- `.claude/skills/aiworkflow-requirements/references/` 配下に audit taxonomy の SSOT があれば `admin_member_note` 行を追加し、`indexes` を `pnpm indexes:rebuild` で再生成

## 完了条件

- すべての T1-T9 の編集差分が `git status` 上で確認可能
- `mise exec -- pnpm typecheck` がパス
- Phase 6 のテスト計画が成立

## 統合テスト連携

- focused unit / route tests と validator を Phase 11 で接続する。

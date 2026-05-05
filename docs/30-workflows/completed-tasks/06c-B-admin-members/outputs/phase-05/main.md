# Phase 05 Main — 実装ランブック

## Classification

| Field | Value |
| --- | --- |
| task | `06c-B-admin-members` |
| phase | `05 / 13` |
| taskType | `implementation-spec / docs-only` |
| docs_only | `true` |

## 実装順序（runbook）

1. **packages/shared/src/admin/search.ts**: `AdminMemberSearch` 型と parser を追加。`q` trim+normalize+max 200 / repeated `tag`(AND) / `sort` 許可リスト / `density` enum を定義。
2. **apps/api/src/lib/audit.ts**: `writeAudit({ actor, target, action })` を追加（既存があれば再利用）。
3. **apps/api/src/routes/admin/members.ts**: `GET /` を query parser + listMembers に接続。`GET /:id` を `{ member, auditLogs[] }` 返却に拡張。`requireAdmin` を全 route に適用。
4. **apps/api/src/routes/admin/member-delete.ts**: `softDeleteMember(DB, id)` を呼び、`writeAudit` を D1 transaction 内で実行。
5. **apps/api/src/routes/admin/member-status.ts**: `restoreMember(DB, id)` + `writeAudit` を transaction で。
6. **apps/web/src/lib/fetch/admin.ts**: `fetchAdminMembers()` / `fetchAdminMember(id)` / `deleteAdminMember(id)` / `restoreAdminMember(id)` を fetch + cookie forwarding で。
7. **apps/web/app/(admin)/admin/members/page.tsx**: search params → fetch → SSR、検索フォーム + table + pagination。
8. **apps/web/src/components/admin/MemberDrawer.tsx**（拡張）: detail drawer + action control（fetch + revalidate）。
9. **apps/web/middleware.ts**: 既存の admin gate を維持、JWT `isAdmin` 未満は login へ redirect。
10. unit / contract / authz suite を green に。
11. `mise exec -- pnpm typecheck && mise exec -- pnpm lint`。

## 擬似コード（参考のみ）

```ts
// apps/api/src/routes/admin/members.ts
admin.get("/", requireAdmin, async (c) => {
  const params = parseSearch(c.req.query());
  const result = await listMembers(c.env.DB, params);
  return c.json(result);
});

admin.post("/:id/delete", requireAdmin, async (c) => {
  const id = c.req.param("id");
  const r = await c.env.DB.batch([
    softDeleteMemberStmt(c.env.DB, id),
    writeAuditStmt(c.env.DB, { actor: c.get("actorId"), target: id, action: "delete" }),
  ]);
  return c.json({ id, isDeleted: true, deletedAt: r.deletedAt });
});
```

## sanity check（実装後）

- [ ] guest → 401 / member → 403 / admin → 200（4 endpoint × 3 ロール = 12 件）
- [ ] delete 後 `filter=deleted` でのみ表示
- [ ] restore 後通常 list に戻る
- [ ] audit_log に actor / target / action / timestamp が揃う
- [ ] role 変更 endpoint が 404 / 405
- [ ] 検索 `sort` 範囲外 / `q` 長大 / `density` 不正 → 422
- [ ] apps/web から D1 binding を参照する import が無い

## 不変条件踏み防止

- #4 / #11: 本文編集 endpoint を作らない
- #5: apps/web は fetch helper 経由のみ。D1 binding を import しない（lint で構造的に禁止）
- #13: handler 内 audit を batch / transaction で書き、失敗時 rollback

## 完了条件チェック

- [x] 実装担当が手順を見て独立に進める粒度
- [x] 擬似コードが正本仕様と整合

## 次 Phase への引き渡し

Phase 6 へ、runbook 11 ステップと sanity check 7 項目を渡す。

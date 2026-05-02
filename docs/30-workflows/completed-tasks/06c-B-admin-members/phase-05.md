# Phase 5: 実装ランブック — 06c-B-admin-members

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-B-admin-members |
| phase | 5 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

実装フェーズで使う runbook（順序・placeholder・sanity check）を定義する。

## 実行タスク

1. apps/api 側に admin members の 4 endpoint を追加し、apps/web middleware と `require-admin` の二段防御で guard する。
2. query builder（filter/q/zone/repeated tag/sort/density/page）を追加し、unit テストで合格させる。
3. delete / restore handler を `07-edit-delete.md` に従い実装し、audit_log を書く。
4. role 変更 UI/API を作らない。
5. apps/web `/admin/members` 一覧 SSR を fetch + cookie forwarding で実装する。
6. apps/web `MemberDrawer` 詳細を拡張し、action control を fetch + revalidate で接続する。
7. authorization unit / contract / authz suite が green になることを確認する。
8. `mise exec -- pnpm typecheck && mise exec -- pnpm lint` を実行する（実装フェーズで）。

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
  const r = await softDelete(c.env.DB, id);
  await writeAudit(c.env.DB, { actor, target: id, action: "delete" });
  return c.json(r);
});
```

## sanity check

- 401 / 403 が想定通りに返る
- delete 後に list で `filter=deleted` を付けないと表示されない
- restore 後は通常 list に戻る
- audit_log に actor / target / action / timestamp が揃う

## 参照資料

- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/07-edit-delete.md
- docs/00-getting-started-manual/specs/12-search-tags.md
- apps/api/src/routes/admin/members.ts
- apps/api/src/routes/admin/member-delete.ts
- apps/api/src/routes/admin/member-status.ts
- apps/api/src/middleware/require-admin.ts

## 実行手順

- 対象 directory: docs/30-workflows/completed-tasks/06c-B-admin-members/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: Phase 4 テスト戦略
- 下流: Phase 6 異常系検証

## 多角的チェック観点

- #4 / #5 / #11 / #13 を実装段階で踏まない
- 検索 query が SQL injection に対し parameterized になる
- audit 書込みが失敗時 transaction で巻き戻される

## サブタスク管理

- [x] runbook を確定する
- [x] sanity check 項目を確定する
- [x] outputs/phase-05/main.md を作成する

## 成果物

- outputs/phase-05/main.md

## 完了条件

- [x] 実装担当が手順を見て独立に進められる
- [x] placeholder / 擬似コードが正本仕様に整合する

## タスク100%実行確認

- [x] この Phase の必須セクションがすべて埋まっている
- [x] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [x] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 6 へ、runbook と sanity check を渡す。

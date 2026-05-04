[実装区分: 実装仕様書]

# Phase 5: 実装ランブック — 06c-B-admin-members-implementation-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-B-admin-members-implementation-execution |
| phase | 5 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 4 で確定したテスト戦略を満たすために、`apps/api` / `apps/web` / `packages/shared` に対する実装手順を順序・関数シグネチャ・SQL 組立・sanity check 単位で確定し、実装担当者が独立して実行できる runbook を提供する。

## 実行タスク

1. `packages/shared/src/admin/search.ts` を schema / constants / URL helper の正本として確認または実装する。
2. `apps/api/src/routes/admin/members.ts` と `member-delete.ts` を API 契約に合わせて確認または実装する。
3. `apps/web` admin members page / client / drawer を URL state と API 経由のみに揃える。
4. focused tests、typecheck、lint、D1 直参照 grep を実行し、結果を Phase 9 / 13 の evidence に渡す。

## 変更対象ファイル一覧

| パス | 種別 | 役割 |
| --- | --- | --- |
| `packages/shared/src/admin/search.ts` | 新規 | `AdminMemberSearchZ` zod schema、`AdminMemberSearch` 型、`ADMIN_SEARCH_LIMITS`、`toAdminApiQuery()` helper |
| `packages/shared/src/admin/index.ts` | 編集 | search モジュールの re-export 追加 |
| `apps/api/src/routes/admin/members.ts` | 編集 | `GET /admin/members` を filter/q/zone/tag[]/sort/density/page 対応に拡張、`{ total, members }` 互換維持 |
| `apps/api/src/routes/admin/member-delete.ts` | 編集 | delete / restore 実装 + `audit_log` 書込み（reason 必須、`DB.batch()` 原子化） |
| `apps/api/src/routes/admin/members.test.ts` | 編集 | 14 ケース追加 |
| `apps/web/app/(admin)/admin/members/page.tsx` | 編集 | Server Component、URL → `AdminMemberSearch` 復元、`fetchAdmin()` 経由で API 呼出 |
| `apps/web/src/components/admin/MembersClient.tsx` | 編集 | Client、検索 input / zone・sort・density select / filter button / tag chip / pagination |
| `apps/web/src/components/admin/MemberDrawer.tsx` | 編集 | drawer 詳細・delete/restore 結果表示・audit log 表示 |
| `apps/web/src/lib/admin/api.ts` | 編集（既存利用） | delete / restore mutation helper |

## 主要関数・型シグネチャ

```ts
// packages/shared/src/admin/search.ts
export const ADMIN_SEARCH_LIMITS = {
  Q_LIMIT: 200,
  TAG_LIMIT: 5,
  PAGE_SIZE: 50,
} as const;

export const AdminMemberSearchZ = z.object({
  filter: z.enum(["published", "hidden", "deleted"]).optional(),
  q: z.string().transform((s) => s.trim().replace(/\s+/g, " "))
       .pipe(z.string().max(ADMIN_SEARCH_LIMITS.Q_LIMIT)).optional(),
  zone: z.enum(["all", "0_to_1", "1_to_10", "10_to_100"]).default("all"),
  tag: z.array(z.string()).max(ADMIN_SEARCH_LIMITS.TAG_LIMIT).default([]),
  sort: z.enum(["recent", "name"]).default("recent"),
  density: z.enum(["comfy", "dense", "list"]).default("comfy"),
  page: z.coerce.number().int().min(1).default(1),
});
export type AdminMemberSearch = z.infer<typeof AdminMemberSearchZ>;
export function toAdminApiQuery(s: AdminMemberSearch): URLSearchParams;
```

```ts
// apps/api/src/routes/admin/members.ts
admin.get("/", requireAdmin, async (c) => {
  const parsed = AdminMemberSearchZ.safeParse(parseQuery(c.req.query()));
  if (!parsed.success) return c.json({ error: "BAD_REQUEST" }, 422);
  const { sql, bindings } = buildAdminMembersQuery(parsed.data);
  const members = await c.env.DB.prepare(sql).bind(...bindings).all();
  const total = await c.env.DB.prepare(countSql).bind(...countBindings).first();
  return c.json({ total, members, page: parsed.data.page, pageSize: 50 });
});

// apps/api/src/routes/admin/member-delete.ts
admin.post("/:memberId/delete", requireAdmin, async (c) => {
  const { reason } = await c.req.json();
  if (!reason || reason.length > 500) return c.json({ error: "BAD_REQUEST" }, 422);
  await c.env.DB.batch([
    softDeleteStmt(memberId),
    auditAppendStmt({ actor, target: memberId, action: "admin.member.deleted", reason }),
  ]);
  return c.json({ id: memberId, isDeleted: true, deletedAt });
});
```

## 入出力・副作用

- 入力: HTTP query / body, Cookie（session）
- 出力: JSON `{ total, members, page, pageSize }` / `{ id, isDeleted: true, deletedAt }` / `{ id, restoredAt }` / `{ error }`
- 副作用:
  - `member_status.is_deleted` 更新
  - `audit_log` への INSERT
  - apps/web は revalidate（`revalidatePath("/admin/members")`）

## SQL 組立詳細

- `q`: `LOWER(...) LIKE LOWER(?) ESCAPE '\'`、対象 `response_email` ∪ `json_extract(answers_json, '$.<field>')`（`fullName / nickname / occupation / location / businessOverview / skills / canProvide / selfIntroduction`）の OR
- `zone`: `json_extract(answers_json, '$.ubmZone') = ?`
- `tag` AND: 各 tag を `EXISTS (SELECT 1 FROM member_tags mt JOIN tag_definitions td ON mt.tag_id=td.id WHERE mt.member_id=mi.member_id AND td.code=?)` で連結
- `sort=name`: `ORDER BY json_extract(answers_json, '$.fullName') ASC, last_submitted_at DESC`
- `sort=recent`: `ORDER BY last_submitted_at DESC`
- `LIMIT 50 OFFSET (page-1)*50`
- `total`: `COUNT(DISTINCT mi.member_id)` を別 prepared statement で取得

## 実装手順（ステップ）

1. `packages/shared/src/admin/search.ts` を新規作成し、`AdminMemberSearchZ` / `toAdminApiQuery()` / `ADMIN_SEARCH_LIMITS` を export する。`packages/shared/src/admin/index.ts` で re-export。
2. `mise exec -- pnpm vitest run packages/shared` で shared unit が green になることを確認。
3. `apps/api/src/routes/admin/members.ts` の handler を上記 schema で safeParse → buildAdminMembersQuery → execute に変更。response shape `{ total, members }` 互換を保つ。
4. `apps/api/src/routes/admin/member-delete.ts`：reason 必須化、delete / restore を status / deleted_members / audit_log の `c.env.DB.batch([...])` で原子実行。
5. `apps/api/src/routes/admin/member-delete.test.ts`：delete / restore response shape、reason 422、409、audit log を検証。
6. `apps/api/src/routes/admin/members.test.ts` に Phase 4 の 14 ケースを追加。`mise exec -- pnpm vitest run apps/api/src/routes/admin/members.test.ts` 全 pass。
7. `apps/web/app/(admin)/admin/members/page.tsx`：Server Component で `searchParams` から `AdminMemberSearchZ.safeParse` → `fetchAdmin("/admin/members?" + toAdminApiQuery())`。
8. `MembersClient.tsx`：input / select / filter button / pagination を URL state と同期。
9. `MemberDrawer.tsx`：detail + audit + delete confirm + restore action。
10. `mise exec -- pnpm typecheck && mise exec -- pnpm lint` で warning 0 を確認。

## sanity check

- guest アクセス → 401、member → 403、admin → 200
- delete 後、`filter=deleted` 指定時のみ表示
- restore 後、通常 list に戻る
- `audit_log` に `actor / target / action / created_at` が揃う
- apps/web から `D1Database` import が存在しない（grep で 0 件）
- 検索 query は parameterized（`?` placeholder）で SQL injection 不可

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm vitest run apps/api/src/routes/admin/members.test.ts
mise exec -- pnpm vitest run packages/shared
```

## DoD

- [ ] 上記 11 ファイルの変更が完了し、typecheck / lint が pass
- [ ] members.test.ts が 14 ケース全 pass
- [ ] sanity check 全項目が手元で確認可能
- [ ] 不変条件 #4 / #5 / #11 / #13 を侵していない

## 参照資料

- `docs/00-getting-started-manual/specs/11-admin-management.md`
- `docs/00-getting-started-manual/specs/07-edit-delete.md`
- `docs/00-getting-started-manual/specs/12-search-tags.md`
- `docs/30-workflows/completed-tasks/06c-B-admin-members/outputs/phase-12/implementation-guide.md`

## 統合テスト連携

- 上流: Phase 4 テスト戦略
- 下流: Phase 6 異常系検証

## 多角的チェック観点

- 検索 query が SQL injection に対し parameterized
- audit 書込み失敗時 transaction で巻き戻る（`DB.batch`）
- apps/web → apps/api 経由で D1 に到達する経路が唯一
- shared schema を 1 箇所に集約して duplication が無い

## サブタスク管理

- [ ] runbook の手順 1〜10 を確定する
- [ ] sanity check を確定する
- [ ] 関数シグネチャを確定する
- [ ] outputs/phase-05/main.md を作成する

## 成果物

- `outputs/phase-05/main.md`

## 完了条件

- [ ] 実装担当が手順 1〜10 を見て独立に進められる
- [ ] 関数シグネチャ・SQL が implementation-guide と整合する

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 仕様書作成内で実装・deploy・commit・push・PR を行っていない
- [ ] CONST_005 必須項目が網羅されている

## 次 Phase への引き渡し

Phase 6 へ、runbook と sanity check 一覧、SQL 組立詳細を渡す。

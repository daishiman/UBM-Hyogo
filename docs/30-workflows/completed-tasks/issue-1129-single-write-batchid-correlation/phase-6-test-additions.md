# Phase 6: テスト拡充

## ステータス: completed

issue #1129 の fail path / 回帰 guard を追加する。Phase 4 の正常系（batchId 付与・フィルタヒット）に対し、
本 Phase は **noop 非退化（AC-5）** と **bulk batchId と単一 batchId が混在しても衝突しないこと（AC-6）** を
回帰テストとして固定する。

---

## 拡充するファイル

| ファイル | 追加内容 |
|---------|---------|
| `apps/api/src/routes/admin/members.tags.contract.spec.ts` | noop 非退化（batchId を生成しない）・assign/unassign の batchId が別 UUID であること |
| `apps/api/src/routes/admin/audit.contract.spec.ts` | bulk 由来 batchId（固定 seed）と単一 write 由来 batchId（動的 UUID）の混在検索で相互に漏れないこと |

---

## 追加 test ケース一覧

### 1. noop 非退化（AC-5 回帰 guard）

`members.tags.contract.spec.ts`。Phase 4 の A-T2b / A-T8b を回帰 guard として明確化し、
「append が呼ばれない＝audit 行が増えない＝batchId も生成されない」を固定する。

| テストID | 対象 | 期待値 |
|----------|------|--------|
| A-T2c | 既存 tag を 2 回 POST（2 回目 noop） | `auditCount("admin.member.tag_assigned") === 1`。`latestAuditPayload` の after.batchId は 1 回目のもの 1 種類のみ（重複 audit 行が無い）。 |
| A-T8c | 未存在付与の DELETE（noop） | `auditCount("admin.member.tag_unassigned") === 0`。audit 行が 0 ＝ batchId 生成も 0。 |

実装方針（A-T2c）:

```ts
it("A-T2c: 既存 tag 再 POST(noop) では audit が増えず batchId も追加されない", async () => {
  const app = createAdminMembersRoute();
  const post = async () =>
    app.request(
      "/members/m1/tags",
      {
        method: "POST",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({ tagId: "tag_eng" }),
      },
      makeEnv(env),
    );
  await post();
  await post(); // noop
  expect(await auditCount(env, "admin.member.tag_assigned")).toBe(1);
});
```

### 2. assign / unassign の batchId が別 UUID（群サイズの違い）

`members.tags.contract.spec.ts`。単一 write は群サイズ 1。同一 member に対し assign と unassign を
別リクエストで実行すると、**それぞれ独立した batchId** が付くことを検証する（bulk のように
複数行が同一 batchId を共有しないことの裏返し）。

| テストID | 対象 | 期待値 |
|----------|------|--------|
| A-T12 | 同一 member（m1 / tag_eng）に assign → unassign を別リクエストで実行 | assign の after.batchId と unassign の before.batchId が共に UUID v4 で、かつ `!==`（別 UUID）。 |

```ts
it("A-T12: 同一 member への assign と unassign は別々の batchId を持つ", async () => {
  const app = createAdminMembersRoute();
  await app.request(
    "/members/m1/tags",
    {
      method: "POST",
      headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
      body: JSON.stringify({ tagId: "tag_eng" }),
    },
    makeEnv(env),
  );
  await app.request(
    "/members/m1/tags/tag_eng",
    { method: "DELETE", headers: { ...(await adminAuthHeader()) } },
    makeEnv(env),
  );
  const assignPayload = await latestAuditPayload(env, "admin.member.tag_assigned");
  const unassignPayload = await latestAuditPayload(env, "admin.member.tag_unassigned");
  const assignBatchId = (assignPayload?.after as { batchId: string }).batchId;
  const unassignBatchId = (unassignPayload?.before as { batchId: string }).batchId;
  expect(assignBatchId).toMatch(UUID_V4);
  expect(unassignBatchId).toMatch(UUID_V4);
  expect(assignBatchId).not.toBe(unassignBatchId);
});
```

### 3. bulk batchId と単一 batchId の混在非衝突（AC-6 回帰）

`audit.contract.spec.ts`。既存 seed には bulk 由来の固定 batchId `batch-1079`（audit_006 / audit_007）が
存在する。本ケースは、その seed を残したまま **単一 write を route 経由で実行** し、
両系統の batchId が相互に漏れないことを検証する。

| テストID | 対象 | 期待値 |
|----------|------|--------|
| AU-1129-3 | bulk seed（`batch-1079`）が存在する状態で単一 assign を実行し、`?batchId=batch-1079` を検索 | items は bulk の audit_006 / audit_007 のみ（2 件）。単一 write の動的 UUID 行は含まれない。 |
| AU-1129-4 | 同状態で `?batchId=<単一 write の uuid>` を検索 | items は単一 write 由来の 1 行のみ。bulk の `batch-1079` 行（audit_006/007）や `batch-other`（audit_008）は含まれない。 |

実装方針: `createAdminMembersRoute` で m1/tag_eng を assign（member/tag を audit.contract 側にも inline seed）
→ `audit_log` から生成 UUID を逆引き → `createAdminAuditRoute` で 2 系統をそれぞれ検索し、
混在しても result set が交差しないことを assert する。

```ts
// 概略
it("AU-1129-4: 単一 write の batchId 検索に bulk batchId 行が混入しない", async () => {
  // 1) members route で m1/tag_eng を assign（事前に member/tag を seed）
  // 2) audit_log から after_json の batchId を取得（= 単一 write 由来 uuid）
  // 3) audit route で ?batchId=<uuid> を検索
  const body = (await res.json()) as { items: Array<{ auditId: string; action: string }> };
  expect(body.items).toHaveLength(1);
  expect(body.items[0]?.action).toBe("admin.member.tag_assigned");
  expect(body.items.map((i) => i.auditId)).not.toContain("audit_006"); // bulk batch-1079
  expect(body.items.map((i) => i.auditId)).not.toContain("audit_008"); // batch-other
});
```

---

## 回帰観点まとめ

- **AC-5**: noop（changes=0）で append・batchId 生成が走らない（A-T2c / A-T8c）。
- **AC-6**: bulk と単一の batchId は別名前空間ではないが、UUID は一意かつ bulk の固定 ID（`batch-1079` 等）と
  衝突しない。SQL は `= ?` の完全一致のため、片方の検索にもう片方が混入しない（AU-1129-3 / AU-1129-4）。
- **群サイズ**: 単一 write は 1 リクエスト = 1 batchId = 1 audit 行。bulk（issue-1079 系）は 1 batchId = N audit 行。
  この差を A-T12（単一の assign/unassign は別 batchId）で固定する。

---

## 完了条件

- [x] A-T2c / A-T8c（noop 非退化・AC-5）を既存 A-T2 / A-T8 に統合し、実装後も Green であることを確認した。
- [x] A-T12（assign と unassign は別 UUID）を追加し Green であることを確認した。
- [x] AU-1129-3 / AU-1129-4（bulk batchId と単一 batchId の混在非衝突・AC-6）を single write batchId filter test に統合し、`batch-1079` 検索が既存 bulk 2 行のみ返すことを確認した。
- [x] 既存 `batch-1079` 系テストが引き続き Green であることを確認した。
- [x] `mise exec -- pnpm exec vitest run --config vitest.d1.config.ts apps/api/src/routes/admin/members.tags.contract.spec.ts apps/api/src/routes/admin/audit.contract.spec.ts` で対象 2 spec が全 PASS することを確認した。
- [x] 追加テストファイル名が `*.contract.spec.ts`（`.test.` 禁止）であることを確認した。

# Phase 6: テスト拡充

> Phase 4（基本 RED/GREEN）の後、境界・異常系・回帰 guard・audit 内容・移行先検証の全分岐を追加してカバレッジを引き上げる。
> 追加先は Phase 4 で拡張した 2 ファイル（`tagDefinitions.write.repository.spec.ts` / `tags.contract.spec.ts`）の force-migration describe ブロック。
> 「ガード節の全分岐パターン列挙」（UT-W3-HTTP 教訓）を徹底する。
> 全テストは **D1 config（`vitest.d1.config.ts`）必須**。
> seed は Phase 4 §2.1（src=tag_src 参照3 / dest=tag_dest 参照1[m2 衝突] / tag_dest_inact 参照0）を流用する。

## 1. AC-7 regression（migrateTo 未指定の既存挙動を固定・退化させない）

issue-1070 の 409 / 204 経路が **強制移行追加で 1 mm も変わらない**ことを最優先 guard として固定する。

| ID | 層 | シナリオ | 期待 |
|----|----|----------|------|
| E-AC7-1 | route | 参照3 + migrateTo 無し | `409 tag_has_references`、`referenceCount===3`、`tag_src` row 残存、`member_tags` src 参照=3 不変、`references_migrated` audit 0 |
| E-AC7-2 | route | src 参照を全削除 → migrateTo 無し | `204`、`tag_src` 消滅、`physically_deleted` audit 1、`references_migrated` audit 0 |
| E-AC7-3 | route | 不在 tag + migrateTo 無し | `404 tag_not_found`（既存どおり）、audit 0 |
| E-AC7-4 | route | **空 migrateTo（`?migrateTo=`）は明示エラー** | `?migrateTo=` で参照3 → `404 migration_target_not_found`（trim 後の空文字は移行先不在として扱い、既存経路へフォールバックしない） |

```ts
it("E-AC7-1 [AC-7]: migrateTo 未指定 + 参照あり は従来どおり 409（移行発生なし）", async () => {
  const app = createAdminTagsRoute();
  const res = await app.request(
    "/tags/tag_src/physical",
    { method: "DELETE", headers: { ...(await adminAuthHeader()) } },
    makeEnv(env),
  );
  expect(res.status).toBe(409);
  const body = (await res.json()) as { error: string; referenceCount: number };
  expect(body.error).toBe("tag_has_references");
  expect(body.referenceCount).toBe(3);
  expect(await countMemberTagReferences(env.ctx, "tag_src")).toBe(3); // 移行されていない
  expect(await auditCount(env, "admin.tag.references_migrated", "tag_src")).toBe(0);
});

it("E-AC7-4 [AC-7 境界]: 空 migrateTo は移行先不在として拒否する", async () => {
  const app = createAdminTagsRoute();
  const res = await app.request(
    "/tags/tag_src/physical?migrateTo=",
    { method: "DELETE", headers: { ...(await adminAuthHeader()) } },
    makeEnv(env),
  );
  expect(res.status).toBe(404);
  expect(await res.json()).toEqual({ ok: false, error: "migration_target_not_found" });
  expect(await countMemberTagReferences(env.ctx, "tag_src")).toBe(3);
  expect(await auditCount(env, "admin.tag.references_migrated", "tag_src")).toBe(0);
});
```

## 2. 移行先検証 3 種の拒否ケース全分岐（AC-5・ガード全列挙）

`forceMigrateAndPhysicalDeleteTagDefinition` の `ok:false` variant を全網羅し、**いずれの拒否でも移行・削除が一切起きない**ことを副作用ゼロで固定する。

### 2.1 `forceMigrateAndPhysicalDeleteTagDefinition`（`ForceMigrateAndPhysicalDeleteTagResult` 各 variant・repository）

| variant | パターン | ID | 期待 |
|---------|----------|----|------|
| `same_as_source` | src===dest | E-V1 | `{ok:false, reason:"same_as_source"}`。src 参照=3 不変・row 残存 |
| `not_found` | src 不在 | E-V2 | `{ok:false, reason:"not_found"}`。dest 不変 |
| `target_not_found` | dest 不在 | E-V3 | `{ok:false, reason:"target_not_found"}`。src 参照=3 不変・row 残存 |
| `target_inactive` | dest active=0 | E-V4 | `{ok:false, reason:"target_inactive"}`。src 参照=3 不変・row 残存 |
| `ok:true` | 正常 | E-V5 | `{ok:true, migratedCount:3, row}`。src 消滅・dest 参照=3 |

```ts
it("E-V4: 移行先 非active は移行も削除もせず target_inactive（副作用ゼロ）", async () => {
  const r = await forceMigrateAndPhysicalDeleteTagDefinition(env.ctx, "tag_src", "tag_dest_inact");
  expect(r).toEqual({ ok: false, reason: "target_inactive" });
  expect(await countMemberTagReferences(env.ctx, "tag_src")).toBe(3);
  expect(await countMemberTagReferences(env.ctx, "tag_dest_inact")).toBe(0); // 移行されていない
  expect(await getTagDefinitionByIdRaw(env.ctx, "tag_src")).not.toBeNull(); // 削除されていない
});
```

### 2.2 route 層 error code / HTTP 透過（Phase 2 §2.8 変換表の全行）

| 内部 reason | error code | HTTP | ID | body |
|-------------|-----------|------|----|------|
| `same_as_source` | `migration_target_same_as_source` | 400 | E-VC1 | `{ok:false, error:"migration_target_same_as_source"}` |
| `not_found` | `tag_not_found` | 404 | E-VC2 | `{ok:false, error:"tag_not_found"}` |
| `target_not_found` | `migration_target_not_found` | 404 | E-VC3 | `{ok:false, error:"migration_target_not_found"}` |
| `target_inactive` | `migration_target_inactive` | 409 | E-VC4 | `{ok:false, error:"migration_target_inactive", migrateTo}` |
| `has_references` | `tag_has_references` | 409 | E-VC5（防御） | `{ok:false, error:"tag_has_references", referenceCount}` |

```ts
it("E-VC1: src===dest は 400 migration_target_same_as_source・audit 0", async () => {
  const app = createAdminTagsRoute();
  const res = await app.request(
    "/tags/tag_src/physical?migrateTo=tag_src",
    { method: "DELETE", headers: { ...(await adminAuthHeader()) } },
    makeEnv(env),
  );
  expect(res.status).toBe(400);
  expect((await res.json() as { error: string }).error).toBe("migration_target_same_as_source");
  expect(await auditCount(env, "admin.tag.references_migrated", "tag_src")).toBe(0);
  expect(await auditCount(env, "admin.tag.physically_deleted", "tag_src")).toBe(0);
});
```

## 3. 衝突吸収・件数境界（AC-2・migratedCount 実測）

| ID | 層 | arrange | act | 期待 |
|----|----|---------|-----|------|
| E-M1 | repository | src 参照0（誰も付与なし） | `migrateMemberTagReferences(ctx,"tag_src","tag_dest")` | `{migratedCount:0}`。dest 既存(m2)不変。境界: 参照0でも例外なく no-op |
| E-M2 | repository | 全 member が src/dest 両持ち（m1/m2/m3 全衝突） | migrate | `{migratedCount:3}`。dest 参照=3（重複生成なし・全件 OR IGNORE）。src=0 |
| E-M3 | repository | src 参照1 / dest 参照0（衝突なし） | migrate | `{migratedCount:1}`。dest 参照=1（純粋付け替え） |
| E-M4 | repository | migratedCount = 移行前 source 参照数 同値確認 | 事前 `countMemberTagReferences(src)` を取得 → migrate | `migratedCount === 事前 src 参照数`（衝突分含む） |
| E-M5 | repository | 移行後の他列保持 | 共通 seed で migrate → dest の m1 行を直読 | `source/confidence/assigned_by` が src 行値を引き継いでいる（SELECT 句が列を正しく写経している証跡） |

```ts
it("E-M2: 全 member 衝突でも migratedCount=元参照数・dest 重複なし（AC-2）", async () => {
  // m1,m3 にも dest を事前付与し、m1/m2/m3 全員 src+dest 両持ちにする
  await env.db.prepare(
    `INSERT INTO member_tags (member_id, tag_id, source, confidence, assigned_by)
     VALUES ('m1','tag_dest','manual',NULL,'a@e.com'),
            ('m3','tag_dest','manual',NULL,'a@e.com')`,
  ).run();
  const r = await migrateMemberTagReferences(env.ctx, "tag_src", "tag_dest");
  expect(r).toEqual({ migratedCount: 3 });
  const dest = await env.db
    .prepare("SELECT COUNT(*) AS n FROM member_tags WHERE tag_id='tag_dest'")
    .first<{ n: number }>();
  expect(dest?.n).toBe(3); // 全員既存だったので件数は 3 のまま（重複生成なし）
  expect(await countMemberTagReferences(env.ctx, "tag_src")).toBe(0);
});

it("E-M5: 移行行は src 行の source/assigned_by を引き継ぐ（SELECT 句列の正しさ）", async () => {
  await migrateMemberTagReferences(env.ctx, "tag_src", "tag_dest");
  const row = await env.db
    .prepare("SELECT source, assigned_by FROM member_tags WHERE member_id='m1' AND tag_id='tag_dest'")
    .first<{ source: string; assigned_by: string }>();
  expect(row?.source).toBe("manual");
  expect(row?.assigned_by).toBe("admin@e.com");
});
```

## 4. 二段ガード（移行後 COUNT=0 再検証）— AC-3

| ID | 層 | シナリオ | 期待 |
|----|----|----------|------|
| E-S1 | repository | 正常移行 → 移行後 src 参照0 → 削除実行 | `{ok:true}`。`getTagDefinitionByIdRaw(src)===null`（物理削除済み）。`has_references` は返らない |
| E-S2 | repository | dest=src 以外への正常移行で dest 集約後、src 行が確実に 0 化していることを削除前提として確認 | 削除前 `countMemberTagReferences(src)===0`（migrate 後の状態）→ その後 `ok:true` |

> `has_references` は移行後 src 参照が残る異常（実運用では batch 原子実行のため発生しない）に対する防御分岐であり、正常系では到達しない。E-S1/E-S2 で「防御分岐が成功系を阻害しない」ことを固定する。inject 困難な異常 race は意図的にテストしない（CONST_007・過剰再現を避ける）。

## 5. audit 記録の検証（AC-4・before/after 内容）

Phase 4 は audit の **件数**中心。Phase 6 は `before_json` / `after_json` の **中身**と発火順を検証する。

```ts
const auditRow = async (env: InMemoryD1, action: string, targetId: string) =>
  env.db
    .prepare(
      "SELECT before_json, after_json FROM audit_log WHERE target_type='tag' AND action=?1 AND target_id=?2 ORDER BY created_at DESC LIMIT 1",
    )
    .bind(action, targetId)
    .first<{ before_json: string | null; after_json: string | null }>();
```

| ID | シナリオ | 期待 |
|----|----------|------|
| E-A1 | references_migrated before/after | FM 成功後、`admin.tag.references_migrated` の `before_json` parse = `{tag_id:"tag_src", dest:"tag_dest", referenceCount:3}`、`after_json` parse = `{migratedCount:3, deleted:true}` |
| E-A2 | physically_deleted before=full row / after=null | FM 成功後、`admin.tag.physically_deleted` の `before_json` parse = 削除前 row（`rowBody` shape：`tagId/code/label/category/active` 等）、`after_json` は **null** |
| E-A3 | 拒否時 audit 0（全 reason） | E-VC1..E-VC4（400/404/409 拒否）後、`references_migrated` / `physically_deleted` の audit row が **共に 0 件**（移行が起きていない証跡） |
| E-A4 | audit 2 件の併存 | FM 成功後、`tag_src` に対する `references_migrated` 1 件 + `physically_deleted` 1 件が共存（合計 2 件） |

```ts
it("E-A1: references_migrated の before/after 内容（AC-4）", async () => {
  const app = createAdminTagsRoute();
  await app.request(
    "/tags/tag_src/physical?migrateTo=tag_dest",
    { method: "DELETE", headers: { ...(await adminAuthHeader()) } },
    makeEnv(env),
  );
  const row = await auditRow(env, "admin.tag.references_migrated", "tag_src");
  expect(JSON.parse(row!.before_json!)).toEqual({ tag_id: "tag_src", dest: "tag_dest", referenceCount: 3 });
  expect(JSON.parse(row!.after_json!)).toEqual({ migratedCount: 3, deleted: true });
});

it("E-A3: 移行先 非active 拒否では audit が 1 件も増えない", async () => {
  const app = createAdminTagsRoute();
  await app.request(
    "/tags/tag_src/physical?migrateTo=tag_dest_inact",
    { method: "DELETE", headers: { ...(await adminAuthHeader()) } },
    makeEnv(env),
  );
  expect(await auditCount(env, "admin.tag.references_migrated", "tag_src")).toBe(0);
  expect(await auditCount(env, "admin.tag.physically_deleted", "tag_src")).toBe(0);
});
```

## 6. ガード節の全分岐パターン列挙（UT-W3-HTTP 教訓）

`DELETE /tags/:tagId/physical` の query 分岐 × 結果 variant を網羅する一覧。

| query | 内部結果 | パターン | 期待 |
|-------|----------|----------|------|
| 無し / 空 | `physicalDeleteTagDefinition` not_found | 不在 tag | `404 tag_not_found`、audit 0 |
| 無し / 空 | has_references | 参照>0 | `409 tag_has_references`+referenceCount、audit 0 |
| 無し / 空 | ok | 参照0 | `204`、physically_deleted audit 1 |
| `migrateTo` | same_as_source | src===dest | `400 migration_target_same_as_source`、audit 0 |
| `migrateTo` | not_found | src 不在 | `404 tag_not_found`、audit 0 |
| `migrateTo` | target_not_found | dest 不在 | `404 migration_target_not_found`、audit 0 |
| `migrateTo` | target_inactive | dest active=0 | `409 migration_target_inactive`+migrateTo、audit 0 |
| `migrateTo` | ok | 正常 | `204`、migrated+physically_deleted audit 2 |

> 上記 8 行を E-AC7-* / E-VC1..E-VC4 / FM-C1..FM-C6（Phase 4）で全網羅。漏れがないこと（カバレッジ確認は Phase 7）。

## 7. authz ガード（強制移行経路も requireAdmin 配下）

| ID | 入力 | 期待 |
|----|------|------|
| E-Z1 | DELETE `/tags/tag_src/physical?migrateTo=tag_dest` 未認証 | `401`（`requireAdmin`）。移行・削除・audit いずれも発生しない |

## 8. regression（既存 surface 不変）— AC-7 + 周辺

強制移行追加が既存 tag CRUD / lifecycle を壊さないことを既存 `tags.contract.spec.ts` の既存ケースで担保（新規追加不要・既存 describe が回帰として機能）。本 Phase では以下を明示確認する:

| ID | 対象 | 期待 |
|----|------|------|
| E-RG1 | 既存 logical DELETE `/tags/:tagId`（active=0） | 不変（強制移行は `/physical?migrateTo` のみ・logical 経路に触れない） |
| E-RG2 | 既存 reactivate / create / update | 不変（audit union 拡張は additive・既存 action 変化なし） |
| E-RG3 | `?migrateTo` 未指定 physical（issue-1070） | E-AC7-1..E-AC7-4 で完全固定 |

## 9. 拡充後の targeted run

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm lint
```

全件 PASS を Phase 6 完了条件とする。

## 10. 成果物

| 成果物 | 内容 |
|--------|------|
| AC-7 regression（未指定 409/204 + 空 migrateTo 境界）| `tags.contract.spec.ts`（force-migration describe に追加） |
| 移行先検証 3 種の全 variant（repository + route 透過）| 両 spec |
| 衝突吸収・件数境界（0/1/N・全衝突）+ 他列保持 | `tagDefinitions.write.repository.spec.ts` |
| 二段ガード（移行後 COUNT=0 再検証）| `tagDefinitions.write.repository.spec.ts` |
| audit before/after 内容 + 拒否時 0 件 + 2 件併存 | `tags.contract.spec.ts` |
| ガード節 8 分岐の全網羅一覧 | 両 spec（Phase 4 ケースとの対応表） |

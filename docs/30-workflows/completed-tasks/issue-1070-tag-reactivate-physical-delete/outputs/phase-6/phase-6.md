# Phase 6: テスト拡充

> Phase 4（基本 RED/GREEN）の後、境界・異常系・冪等・audit 内容・regression guard を追加してカバレッジを引き上げる。
> 追加先は Phase 4 で作成した 2 ファイル（`tagDefinitions.lifecycle.repository.spec.ts` / `tags.lifecycle.contract.spec.ts`）+ 既存 `tags.contract.spec.ts`。
> 「ガード節の全分岐パターン列挙」（UT-W3-HTTP 教訓）を徹底する。
> 全テストは **D1 config（`vitest.d1.config.ts`）必須**。

## 1. physical delete の参照件数境界（0 / N）

`countMemberTagReferences` と `physicalDeleteTagDefinition` の参照件数分岐を境界で網羅する。

| ID | 層 | arrange | act | 期待 |
|----|----|---------|-----|------|
| E-PR1 | repository | 参照0（`tag_inact_free`） | `physicalDeleteTagDefinition` | `{ ok:true, row }`（削除）。境界: count==0 が「削除可」 |
| E-PR2 | repository | 参照1（`tag_inact_ref`） | `physicalDeleteTagDefinition` | `{ ok:false, reason:"has_references", referenceCount:1 }`。境界: count==1（最小の「あり」）で拒否 |
| E-PR3 | repository | 参照N（同 tag に member を **3 件** 付与） | `countMemberTagReferences` → `physicalDeleteTagDefinition` | count===3。`{ ok:false, reason:"has_references", referenceCount:3 }`。N>1 でも正しい件数を返す |
| E-PR4 | repository | 参照あり→ member_tags を全削除して 0 に → physicalDelete | 0 件化後は `{ ok:true }`（削除可能に転じる）。ガードが count の動的値を見ていることを確認 |
| E-PR5 | route | 参照3 | DELETE `/physical` | `409`。body `referenceCount===3`（route が repository の件数をそのまま透過） |

```ts
it("E-PR3: 参照 N(=3) でも referenceCount を正しく返す", async () => {
  // m2, m3 を追加し tag_inact_ref に付与（seed の m1 と合わせ 3 件）
  await env.db.prepare(
    `INSERT INTO member_identities (member_id, response_email, current_response_id, first_response_id, last_submitted_at)
     VALUES ('m2','m2@e.com','r2','r2','2026-04-01T00:00:00Z'),
            ('m3','m3@e.com','r3','r3','2026-04-01T00:00:00Z')`,
  ).run();
  await env.db.prepare(
    `INSERT INTO member_tags (member_id, tag_id, source, confidence, assigned_by)
     VALUES ('m2','tag_inact_ref','manual',NULL,'a@e.com'),
            ('m3','tag_inact_ref','manual',NULL,'a@e.com')`,
  ).run();
  expect(await countMemberTagReferences(env.ctx, "tag_inact_ref")).toBe(3);
  const r = await physicalDeleteTagDefinition(env.ctx, "tag_inact_ref");
  expect(r).toEqual({ ok: false, reason: "has_references", referenceCount: 3 });
});
```

## 2. reactivate の二重実行 idempotency（state 変化なし）

| ID | 層 | シナリオ | 期待 |
|----|----|----------|------|
| E-RI1 | repository | `tag_inact_ref` を 2 回 reactivate | 1 回目 `changed:true` / 2 回目 `changed:false`。最終 active=1 |
| E-RI2 | repository | 既 active `tag_active` を reactivate | `changed:false`、DB の active=1 不変（no UPDATE） |
| E-RI3 | route | `tag_inact_ref` reactivate を 2 回 POST | 両方 200。`auditCount("admin.tag.reactivated","tag_inact_ref")===1`（state 変化した 1 回目のみ append） |
| E-RI4 | route | 既 active reactivate を POST | 200 + audit 0（C-5 冪等） |

```ts
it("E-RI3: 二重 reactivate で audit は 1 件のみ（state 変化時のみ append）", async () => {
  const app = createAdminTagsRoute();
  for (let i = 0; i < 2; i++) {
    const res = await app.request(
      "/tags/tag_inact_ref/reactivate",
      { method: "POST", headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
  }
  expect(await auditCount(env, "admin.tag.reactivated", "tag_inact_ref")).toBe(1);
});
```

## 3. audit の JSON 内容アサート（before / after）

Phase 4 は audit の **件数**のみ。Phase 6 は `before_json` / `after_json` の **中身**を検証する。

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
| E-A1 | reactivated before/after | `tag_inact_ref` を reactivate 後、`admin.tag.reactivated` の `before_json` parse = `{active:false}`、`after_json` parse = `{active:true}` |
| E-A2 | physically_deleted before=full row / after=null | `tag_inact_free`（code=legacy_free,label=参照なし旧タグ,category=misc,active=0）を physical delete 後、`admin.tag.physically_deleted` の `before_json` parse = `{code:"legacy_free",label:"参照なし旧タグ",category:"misc",active:false}`、`after_json` は **null** |
| E-A3 | physical 拒否時 audit 無し | 参照あり `tag_inact_ref` physical delete（409）後、`admin.tag.physically_deleted` の audit row は **0 件**（before/after を検証する row が存在しない） |

```ts
it("E-A2: physically_deleted の before=full row / after=null", async () => {
  const app = createAdminTagsRoute();
  await app.request(
    "/tags/tag_inact_free/physical",
    { method: "DELETE", headers: { ...(await adminAuthHeader()) } },
    makeEnv(env),
  );
  const row = await auditRow(env, "admin.tag.physically_deleted", "tag_inact_free");
  expect(JSON.parse(row!.before_json!)).toEqual({
    code: "legacy_free",
    label: "参照なし旧タグ",
    category: "misc",
    active: false,
  });
  expect(row!.after_json).toBeNull();
});
```

## 4. physical 削除後の同 code 再 create 成功の証跡（code 解放）

logical delete（code 占有継続）との差を明示する。physical 後は UNIQUE 制約から外れ再作成できる。

| ID | 層 | シナリオ | 期待 |
|----|----|----------|------|
| E-CF1 | repository | `tag_inact_free`（code=legacy_free）physical delete → `createTagDefinition({code:"legacy_free",...})` | `{ ok:true, row }`（再作成成功）。新 `tagId` は元の `tag_inact_free` と異なる UUID |
| E-CF2 | repository | **対比**: logical な tag を deactivate → 同 code create | `{ ok:false, reason:"code_conflict" }`（logical では row 残存で code 占有継続） |
| E-CF3 | route | C-P1 の physical delete 後 POST `/tags` `{code:"legacy_free",...}` | `201`。GET `/tags?q=legacy_free` で再作成 row が 1 件 |

```ts
it("E-CF2 [logical vs physical 対比]: deactivate では code 占有が残り再 create は 409", async () => {
  // tag_active(code=engineer) を logical deactivate
  await deactivateTagDefinition(env.ctx, "tag_active");
  const re = await createTagDefinition(env.ctx, {
    code: "engineer",
    label: "再作成",
    category: "occupation",
  });
  expect(re).toEqual({ ok: false, reason: "code_conflict" }); // row 残存で占有継続
});
```

## 5. ガード節の全分岐パターン列挙（UT-W3-HTTP 教訓）

### 5.1 `POST /tags/:tagId/reactivate` のガード

| ガード | パターン | 期待 |
|--------|----------|------|
| `reactivateTagDefinition` null | 不在 tagId | `404 tag_not_found`、audit 0 |
| `result.changed===false` | 既 active | `200`、audit 0（no-op） |
| `result.changed===true` | inactive→active | `200`、audit 1 |

| ID | 入力 | 期待 |
|----|------|------|
| E-G1 | POST `/tags/does-not-exist/reactivate` | `404 tag_not_found`。`auditCount("admin.tag.reactivated")===0` |
| E-G2 | POST `/tags/tag_active/reactivate`（既 active） | `200`、audit 0 |
| E-G3 | POST `/tags/tag_inact_ref/reactivate`（inactive） | `200`、audit 1 |

### 5.2 `DELETE /tags/:tagId/physical` のガード（3 分岐 + 削除）

| ガード（`PhysicalDeleteTagDefinitionResult` 各 variant） | パターン | 期待 |
|--------|----------|------|
| `reason:"not_found"` | 不在 tagId | `404 tag_not_found`、audit 0 |
| `reason:"has_references"` | 参照>0 | `409 tag_has_references` + referenceCount、audit 0、row 保持 |
| `ok:true` | 参照0 | `204`、audit 1、DB から消滅 |

| ID | 入力 | 期待 |
|----|------|------|
| E-G4 | DELETE `/tags/does-not-exist/physical` | `404 tag_not_found`、audit 0 |
| E-G5 | DELETE `/tags/tag_inact_ref/physical`（参照1） | `409`、`referenceCount===1`、audit 0、tag_definitions row 残存 |
| E-G6 | DELETE `/tags/tag_inact_free/physical`（参照0） | `204`、audit 1、DB COUNT 0 |
| E-G7 | DELETE `/tags/tag_active/physical`（active かつ参照0） | `204`（physical は active 状態を問わない。参照のみがガード） |

### 5.3 authz ガード（両 route）

| ID | 入力 | 期待 |
|----|------|------|
| E-G8 | POST `/tags/tag_inact_ref/reactivate` 未認証 | `401`（`requireAdmin`） |
| E-G9 | DELETE `/tags/tag_inact_free/physical` 未認証 | `401` |

## 6. regression（既存 surface 不変）— AC-6

physical / reactivate 追加が既存 tag CRUD を壊さないことを既存 `tags.contract.spec.ts` で固定する。

| ID | 対象 | 期待 |
|----|------|------|
| E-RG1 | 既存 POST `/tags`（create） | 不変（201 / 409 tag_code_conflict / 400）。新 route 追加で挙動変化なし |
| E-RG2 | 既存 PATCH `/tags/:tagId`（update） | 不変（200 / 404 / 400 no_update_fields）。code immutable 維持 |
| E-RG3 | 既存 DELETE `/tags/:tagId`（logical） | `204` + `active===0`。**row は消えない**（physical と分離）。`member_tags` 保持。`auditCount("admin.tag.deactivated")===1` |
| E-RG4 | logical と physical の経路非干渉 | `tag_eng` を logical DELETE 後、`reactivated`/`physically_deleted` の audit は 0（logical 経路から新 action が誤発火しない） |
| E-RG5 | routing 非衝突 | `DELETE /tags/:tagId` と `DELETE /tags/:tagId/physical` が別解決（`/physical` 静的セグメント優先）。`tag_eng` への `/physical` 無し DELETE は logical（active=0）、`/physical` 付きは hard delete |

```ts
it("E-RG3 [AC-6]: 既存 logical DELETE は row を残し active=0（physical と分離）", async () => {
  const app = createAdminTagsRoute();
  const res = await app.request(
    "/tags/tag_eng",
    { method: "DELETE", headers: { ...(await adminAuthHeader()) } },
    makeEnv(env),
  );
  expect(res.status).toBe(204);
  const row = await env.db
    .prepare("SELECT active FROM tag_definitions WHERE tag_id='tag_eng'")
    .first<{ active: number }>();
  expect(row?.active).toBe(0); // row は残る（消えない）
});
```

> E-RG3..E-RG5 は既存 `tags.contract.spec.ts` の seed（`tag_eng` 等）を使う既存 describe 隣に追加する。

## 7. repository 層の追加境界（`tagDefinitions.lifecycle.repository.spec.ts`）

| ID | 対象 | シナリオ | 期待 |
|----|------|----------|------|
| E-RW1 | `reactivateTagDefinition` 戻り row の整合 | inactive を reactivate | 戻り `row.active===true` かつ `code`/`label`/`category` は元値不変（active のみ変化） |
| E-RW2 | `physicalDeleteTagDefinition` の row snapshot | 削除前 row を返す | 戻り `row` の全フィールドが削除前 DB 値と一致（削除後に DB を引いても再現不可なので snapshot 必須） |
| E-RW3 | `countMemberTagReferences` 不在 tag | `"nope"` | `0`（行なし → COUNT 0、例外でない） |
| E-RW4 | physical 後 `getTagDefinitionByIdRaw` | 削除済 tagId を再取得 | `null`（物理削除で行消滅） |

## 8. 拡充後の targeted run

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/tagDefinitions.lifecycle.repository.spec.ts \
  apps/api/src/routes/admin/tags.lifecycle.contract.spec.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm lint
```

全件 PASS を Phase 6 完了条件とする。

## 9. 成果物

| 成果物 | 内容 |
|--------|------|
| 参照件数境界（0/1/N）追加 | `tagDefinitions.lifecycle.repository.spec.ts` / `tags.lifecycle.contract.spec.ts` |
| reactivate 冪等 + audit 回数 assert | 両 lifecycle spec |
| audit JSON 内容（before/after）assert | `tags.lifecycle.contract.spec.ts` |
| code 解放再 create 証跡 + logical 対比 | 両 lifecycle spec |
| logical 非破壊 regression（AC-6） | `tags.contract.spec.ts`（既存に追加） |

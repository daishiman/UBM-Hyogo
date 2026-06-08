# Phase 4: テスト作成（TDD RED）

> 実装区分: **NON_VISUAL**（API only。Phase 11 は `manual-test-result.md` を一次証跡とする）。
> 本 Phase は実装前に **失敗するテスト** を確定する。Phase 5（GREEN）で全件 PASS させる。
> 新規テストファイルは `*.spec.ts` のみ（CLAUDE.md invariant #8）。`*.test.ts` 禁止。
> Phase 2/3 の凍結契約（`migrateMemberTagReferences` / `forceMigrateAndPhysicalDeleteTagDefinition` / route `?migrateTo` 分岐 / error code / audit shape）を SSOT として全て織り込む。
> issue-1070 で landed 済みの `countMemberTagReferences` / `physicalDeleteTagDefinition` / `DELETE /tags/:tagId/physical`（参照あり 409）は本 issue の **前提コード** であり、AC-7 regression で不変を固定する。

## 0. 作成・追加するテストファイル（既存 2 本に追加・新規 0 本）

| # | パス | 種別 | 検証層 | config |
|---|------|------|--------|--------|
| 1 | `apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts`（既存） | repository unit | `migrateMemberTagReferences` / `forceMigrateAndPhysicalDeleteTagDefinition` の戻り値・衝突吸収・移行前 source 参照数・二段ガード | **`vitest.d1.config.ts` 必須**（in-memory D1） |
| 2 | `apps/api/src/routes/admin/tags.contract.spec.ts`（既存） | route contract | `DELETE /tags/:tagId/physical?migrateTo=<dest>` の HTTP status・audit 2 件・移行先検証・AC-7 regression | D1 fixture（route も D1 経由） |

> **新規ファイルは作らない**。issue-1070 の lifecycle テストは `tagDefinitions.write.repository.spec.ts` / `tags.contract.spec.ts` に集約済みのため、強制移行ケースも同 2 ファイルへ `describe("force-migration", ...)` ブロックを足して凝集させる（テストファイル surface を増やさない）。
> private / 内部関数テストは **該当なし**。追加する 2 関数 `migrateMemberTagReferences` / `forceMigrateAndPhysicalDeleteTagDefinition` は両方 public export。route 内 query 分岐はテスト対象だが endpoint 経由で間接検証する（独立 private なし）。`canUseTool` 等 SDK 項目は該当なし（API テストのみ）。

## 1. D1 config 必須の注記（重要）

repository spec（#1）は **必ず `vitest.d1.config.ts` で実行する**。`migrateMemberTagReferences` は実 `INSERT OR IGNORE` / `DELETE FROM member_tags` を発行し、`forceMigrateAndPhysicalDeleteTagDefinition` は `countMemberTagReferences` の実 COUNT を読んで二段ガードを分岐するため、d1mock では `(member_id, dest)` PK 衝突スキップや 移行前 source 参照数 を検証できない。route spec（#2）も `setupD1()` 経由で実 D1 を組む。検証コマンドは Phase 全体共通:

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts
```

## 2. 共通の前提（既存 tag spec に揃える）

- 各 spec 1 行目に `// @vitest-environment node`（`tagDefinitions.write.repository.spec.ts` / `tags.contract.spec.ts` の既存ヘッダに一致）。
- `setupD1`（`apps/api/src/repository/__tests__/_setup.ts`）で in-memory D1 を構築。migration は `apps/api/migrations/*.sql` を全件適用済み（`tag_definitions.active` カラム・`member_tags` テーブル含む）。**migration 追加は不要**（Phase 2 §2.3）。
- `beforeEach` は `setupD1()` → seed、timeout `30000`（migration 適用が重いため前例どおり）。
- route 認証は既存 `tags.contract.spec.ts` の `adminAuthHeader()` / `TEST_AUTH_SECRET` 経路をそのまま使う（`makeEnv` の `AUTH_SECRET`）。
- audit 件数・内容は `audit_log` を直接 SELECT して数える（`target_type='tag'` フィルタ）。既存 contract spec の audit ヘルパーがあれば再利用する。

### 2.1 共通 seed（移行元 src / 移行先 dest / 衝突 member の 3 軸を用意）

強制移行の「衝突吸収（AC-2）」「移行先検証（AC-5）」「二段削除（AC-3）」を全て検証するため、**移行元 inactive tag（参照あり）** と **移行先 active tag** と **衝突する member（src/dest 両持ち）** を seed する。`member_tags` の実列は `member_id, tag_id, source, confidence, assigned_at, assigned_by`（`migrations/0002_admin_managed.sql:43-51`・PK `(member_id, tag_id)` のみ・FK なし）。

```ts
const seedForceMigration = async (env: InMemoryD1) => {
  await env.db
    .prepare(
      `INSERT INTO tag_definitions (tag_id, code, label, category, source_stable_keys_json, active)
       VALUES ('tag_src','legacy_src','誤付与旧タグ','misc','[]',0),
              ('tag_dest','correct','正タグ','misc','[]',1),
              ('tag_dest_inact','old_correct','非activeな移行先候補','misc','[]',0)`,
    )
    .run();
  // member_identities: m1(src のみ) / m2(src+dest 両持ち=衝突) / m3(src のみ)
  await env.db
    .prepare(
      `INSERT INTO member_identities
       (member_id, response_email, current_response_id, first_response_id, last_submitted_at)
       VALUES ('m1','m1@e.com','r1','r1','2026-04-01T00:00:00Z'),
              ('m2','m2@e.com','r2','r2','2026-04-01T00:00:00Z'),
              ('m3','m3@e.com','r3','r3','2026-04-01T00:00:00Z')`,
    )
    .run();
  // src 参照: m1, m2, m3（計 3）/ dest 既存: m2 のみ（衝突対象）
  await env.db
    .prepare(
      `INSERT INTO member_tags (member_id, tag_id, source, confidence, assigned_by)
       VALUES ('m1','tag_src','manual',NULL,'admin@e.com'),
              ('m2','tag_src','manual',NULL,'admin@e.com'),
              ('m3','tag_src','manual',NULL,'admin@e.com'),
              ('m2','tag_dest','manual',NULL,'admin@e.com')`,
    )
    .run();
};
```

> seed 状態の意味:
> - `tag_src`（active=0, 参照3: m1/m2/m3）— 移行元。
> - `tag_dest`（active=1, 既存参照1: m2）— 移行先。**m2 は src/dest 両持ち=PK 衝突対象**。
> - `tag_dest_inact`（active=0, 参照0）— 移行先 非active 拒否（AC-5）の対象。
> - 期待移行結果: 移行後 dest 参照は m1/m2/m3 の **3 件**（m2 は重複せず 1 件に集約）。src 参照は 0。`migratedCount===3`（src から消えた行数 = 元 src 参照数 = m2 の衝突分も含む）。

---

## 3. `tagDefinitions.write.repository.spec.ts`（repository unit・force-migration describe 追加）

### 3.1 import 追加

```ts
import {
  migrateMemberTagReferences,
  forceMigrateAndPhysicalDeleteTagDefinition,
  countMemberTagReferences,        // 既存（前提）
  physicalDeleteTagDefinition,     // 既存（前提）
  getTagDefinitionByIdRaw,         // 既存
} from "../tagDefinitions";
```

### 3.2 `migrateMemberTagReferences` ケース（衝突吸収・移行前 source 参照数 実測）

| ID | シナリオ | arrange / act | assert（期待値） |
|----|----------|---------------|-----------------|
| FM-R1 | 非衝突のみ移行 | dest 既存参照を消し m1/m3 のみ src 付与 → `migrateMemberTagReferences(ctx,"tag_src","tag_dest")` | `{migratedCount:2}`。dest 参照=2（m1/m3）。src 参照=0 |
| FM-R2 | **衝突吸収（AC-2）** | 共通 seed（m2 が src/dest 両持ち）で `migrateMemberTagReferences(ctx,"tag_src","tag_dest")` | `{migratedCount:3}`（src から消えた行数 = m1/m2/m3）。**dest 参照は 3**（m2 は 1 件に集約・重複行なし）。src 参照=0 |
| FM-R3 | **`INSERT OR IGNORE` 衝突スキップ実測（FB-CRONVL-001）** | FM-R2 後、dest の m2 行が **1 件のみ**（PK 重複生成なし）であることを `env.db` 直読で確認 | `SELECT COUNT(*) FROM member_tags WHERE member_id='m2' AND tag_id='tag_dest'` ===1 |
| FM-R4 | **移行前 source 参照数 実測（FB-CRONVL-001）** | FM-R2 で migratedCount が 移行前 source 参照数（=src 行数 3）由来であることを、src 参照件数（事前 3）と一致させて固定 | `migratedCount===3` かつ 事前 `countMemberTagReferences(ctx,"tag_src")===3` |
| FM-R5 | src 参照 0 で移行（境界） | src へ誰も付与しない状態で `migrateMemberTagReferences(ctx,"tag_src","tag_dest")` | `{migratedCount:0}`。dest 既存（m2）不変。src 参照=0（no-op） |

```ts
it("FM-R2: 衝突 member を孤児なく dest へ集約（AC-2）", async () => {
  const r = await migrateMemberTagReferences(env.ctx, "tag_src", "tag_dest");
  expect(r).toEqual({ migratedCount: 3 });
  const dest = await env.db
    .prepare("SELECT COUNT(*) AS n FROM member_tags WHERE tag_id='tag_dest'")
    .first<{ n: number }>();
  expect(dest?.n).toBe(3); // m1,m2,m3（m2 は重複せず 1 件）
  const src = await countMemberTagReferences(env.ctx, "tag_src");
  expect(src).toBe(0);
});

it("FM-R3: INSERT OR IGNORE で衝突 member の dest 行は重複生成されない", async () => {
  await migrateMemberTagReferences(env.ctx, "tag_src", "tag_dest");
  const dup = await env.db
    .prepare("SELECT COUNT(*) AS n FROM member_tags WHERE member_id='m2' AND tag_id='tag_dest'")
    .first<{ n: number }>();
  expect(dup?.n).toBe(1); // PK (member_id,tag_id) で 1 件に収束
});
```

> 実測注記（FB-CRONVL-001）: `migratedCount` は Step 2 の `DELETE FROM member_tags WHERE tag_id=?src` の 移行前 source 参照数（= 元 src 参照数）であり、`INSERT OR IGNORE` の挿入数ではない。FM-R2/FM-R4 で「migratedCount === 移行前 src 参照数（衝突分含む）」を D1 実走で固定する。

### 3.3 `forceMigrateAndPhysicalDeleteTagDefinition` ケース（二段オーケストレーション）

| ID | シナリオ | arrange / act | assert（`ForceMigrateAndPhysicalDeleteTagResult`） |
|----|----------|---------------|-------------------------------|
| FM-1 | **移行 + 物理削除 成功（AC-1/AC-3）** | 共通 seed で `forceMigrateAndPhysicalDeleteTagDefinition(ctx,"tag_src","tag_dest")` | `{ok:true, migratedCount:3, row}`。`row.code==="legacy_src"`（削除前 snapshot）。`env.db` 直読で `tag_definitions` から `tag_src` 消滅（COUNT 0）。dest 参照=3。src 参照=0 |
| FM-2 | **移行先不在（AC-5）** | `forceMigrateAndPhysicalDeleteTagDefinition(ctx,"tag_src","nope")` | `{ok:false, reason:"target_not_found"}`。**移行も削除も発生しない**（src 参照=3 不変・tag_src row 残存） |
| FM-3 | **移行先 非active（AC-5）** | `forceMigrateAndPhysicalDeleteTagDefinition(ctx,"tag_src","tag_dest_inact")` | `{ok:false, reason:"target_inactive"}`。移行/削除なし（src 参照=3 不変） |
| FM-4 | **src===dest（AC-5）** | `forceMigrateAndPhysicalDeleteTagDefinition(ctx,"tag_src","tag_src")` | `{ok:false, reason:"same_as_source"}`。移行/削除なし |
| FM-5 | **移行元不在** | `forceMigrateAndPhysicalDeleteTagDefinition(ctx,"nope","tag_dest")` | `{ok:false, reason:"not_found"}`。dest 不変 |
| FM-6 | **二段ガード（has_references 防御）** | src 参照 0 化困難な異常を狙わず、正常系で移行後 `countMemberTagReferences(src)===0` を経て削除されることを assert（防御分岐が成功系を阻害しない） | FM-1 と同じく `{ok:true}`。`has_references` は返らない |

```ts
it("FM-1: 移行 → COUNT=0 再検証 → 物理削除 の二段が成功（AC-1/AC-3）", async () => {
  const r = await forceMigrateAndPhysicalDeleteTagDefinition(env.ctx, "tag_src", "tag_dest");
  expect(r.ok).toBe(true);
  if (r.ok) {
    expect(r.migratedCount).toBe(3);
    expect(r.row.code).toBe("legacy_src");
  }
  const gone = await env.db
    .prepare("SELECT COUNT(*) AS n FROM tag_definitions WHERE tag_id='tag_src'")
    .first<{ n: number }>();
  expect(gone?.n).toBe(0); // 物理削除済み
  const dest = await countMemberTagReferences(env.ctx, "tag_dest");
  expect(dest).toBe(3);
});

it("FM-3: 移行先が非 active なら移行も削除もせず target_inactive（AC-5）", async () => {
  const r = await forceMigrateAndPhysicalDeleteTagDefinition(env.ctx, "tag_src", "tag_dest_inact");
  expect(r).toEqual({ ok: false, reason: "target_inactive" });
  expect(await countMemberTagReferences(env.ctx, "tag_src")).toBe(3); // 不変
  const stillThere = await getTagDefinitionByIdRaw(env.ctx, "tag_src");
  expect(stillThere).not.toBeNull(); // 削除されていない
});
```

---

## 4. `tags.contract.spec.ts`（route contract・force-migration describe 追加）

### 4.1 helper（既存 contract spec の構成に合わせる）

```ts
// 既存 makeEnv / adminAuthHeader / auditCount を再利用（issue-1070 で導入済みなら流用）。
const auditCount = async (env: InMemoryD1, action: string, targetId?: string): Promise<number> => {
  const sql = targetId
    ? "SELECT COUNT(*) AS n FROM audit_log WHERE target_type='tag' AND action=?1 AND target_id=?2"
    : "SELECT COUNT(*) AS n FROM audit_log WHERE target_type='tag' AND action=?1";
  const stmt = env.db.prepare(sql);
  const bound = targetId ? stmt.bind(action, targetId) : stmt.bind(action);
  const r = await bound.first<{ n: number }>();
  return r?.n ?? 0;
};
```

> seed は §2.1 と同一（src=tag_src / dest=tag_dest / 衝突 m2）。route は `createAdminTagsRoute()` を `app.request(path, init, makeEnv(env))` で叩く。

### 4.2 `DELETE /tags/:tagId/physical?migrateTo=<dest>` ケース

| ID | シナリオ | リクエスト | 期待 |
|----|----------|-----------|------|
| FM-C1 | **移行 + 削除 204（AC-1/AC-3）** | DELETE `/tags/tag_src/physical?migrateTo=tag_dest` | `204`（body なし）。DB `tag_src` 消滅（COUNT 0）。`member_tags` dest 参照=3 / src 参照=0 |
| FM-C2 | **audit 2 件（AC-4）** | FM-C1 後 | `auditCount("admin.tag.references_migrated","tag_src")===1` かつ `auditCount("admin.tag.physically_deleted","tag_src")===1` |
| FM-C3 | 移行先不在 → 404（AC-5） | DELETE `/tags/tag_src/physical?migrateTo=nope` | `404`。`{ok:false, error:"migration_target_not_found"}`。audit 0 件・src 参照=3 不変 |
| FM-C4 | 移行先 非active → 409（AC-5） | DELETE `/tags/tag_src/physical?migrateTo=tag_dest_inact` | `409`。`{ok:false, error:"migration_target_inactive", migrateTo:"tag_dest_inact"}`。audit 0 件 |
| FM-C5 | src===dest → 400（AC-5） | DELETE `/tags/tag_src/physical?migrateTo=tag_src` | `400`。`{ok:false, error:"migration_target_same_as_source"}`。audit 0 件 |
| FM-C6 | 移行元不在 → 404 | DELETE `/tags/nope/physical?migrateTo=tag_dest` | `404`。`{ok:false, error:"tag_not_found"}` |

```ts
it("FM-C1/FM-C2: migrateTo 指定で 204 + audit 2 件（AC-1/AC-3/AC-4）", async () => {
  const app = createAdminTagsRoute();
  const res = await app.request(
    "/tags/tag_src/physical?migrateTo=tag_dest",
    { method: "DELETE", headers: { ...(await adminAuthHeader()) } },
    makeEnv(env),
  );
  expect(res.status).toBe(204);
  const gone = await env.db
    .prepare("SELECT COUNT(*) AS n FROM tag_definitions WHERE tag_id='tag_src'")
    .first<{ n: number }>();
  expect(gone?.n).toBe(0);
  expect(await auditCount(env, "admin.tag.references_migrated", "tag_src")).toBe(1);
  expect(await auditCount(env, "admin.tag.physically_deleted", "tag_src")).toBe(1);
});

it("FM-C4: 移行先 非active → 409 migration_target_inactive（AC-5）", async () => {
  const app = createAdminTagsRoute();
  const res = await app.request(
    "/tags/tag_src/physical?migrateTo=tag_dest_inact",
    { method: "DELETE", headers: { ...(await adminAuthHeader()) } },
    makeEnv(env),
  );
  expect(res.status).toBe(409);
  const body = (await res.json()) as { error: string };
  expect(body.error).toBe("migration_target_inactive");
  expect(await auditCount(env, "admin.tag.references_migrated", "tag_src")).toBe(0);
});
```

### 4.3 AC-7 regression（migrateTo 未指定の既存挙動・退化させない）

issue-1070 既存経路（`migrateTo` 無し）が **完全に不変**であることを固定する。

| ID | シナリオ | リクエスト | 期待 |
|----|----------|-----------|------|
| AC7-1 | 参照あり + migrateTo 無し → 409（不変） | DELETE `/tags/tag_src/physical`（query 無し） | `409`。`{ok:false, error:"tag_has_references", referenceCount:3}`。DB `tag_src` 残存・移行発生せず・audit 0 件 |
| AC7-2 | 参照0 + migrateTo 無し → 204（不変） | 参照を全削除した `tag_src` に DELETE `/tags/tag_src/physical`（query 無し） | `204`。DB 消滅。`physically_deleted` audit 1 件・`references_migrated` audit 0 件 |

```ts
it("AC7-1: migrateTo 未指定 + 参照あり は従来どおり 409 tag_has_references（退化させない）", async () => {
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
  expect(await auditCount(env, "admin.tag.references_migrated", "tag_src")).toBe(0);
});
```

### 4.4 audit 内容（AC-4・migrated shape）

| ID | シナリオ | 期待 |
|----|----------|------|
| AUDIT-1 | references_migrated の before/after | FM-C1 後、`admin.tag.references_migrated` の `before_json` parse = `{tag_id:"tag_src", dest:"tag_dest", referenceCount:3}`、`after_json` parse = `{migratedCount:3, deleted:true}` |

```ts
it("AUDIT-1: references_migrated の before/after JSON 内容（AC-4）", async () => {
  const app = createAdminTagsRoute();
  await app.request(
    "/tags/tag_src/physical?migrateTo=tag_dest",
    { method: "DELETE", headers: { ...(await adminAuthHeader()) } },
    makeEnv(env),
  );
  const row = await env.db
    .prepare(
      "SELECT before_json, after_json FROM audit_log WHERE target_type='tag' AND action='admin.tag.references_migrated' AND target_id='tag_src' ORDER BY created_at DESC LIMIT 1",
    )
    .first<{ before_json: string; after_json: string }>();
  expect(JSON.parse(row!.before_json)).toEqual({ tag_id: "tag_src", dest: "tag_dest", referenceCount: 3 });
  expect(JSON.parse(row!.after_json)).toEqual({ migratedCount: 3, deleted: true });
});
```

### 4.5 authz regression（新 query 分岐も requireAdmin 配下）

| ID | シナリオ | 期待 |
|----|----------|------|
| AC7-Z1 | migrateTo 付き physical 未認証 | DELETE `/tags/tag_src/physical?migrateTo=tag_dest` を Authorization 無し → `401`（`requireAdmin`） |

---

## 5. Phase-11 evidence 対応表

| Phase-11 evidence ID | 対応テストケース |
|----------------------|------------------|
| TC-FM-1（移行+削除成功） | FM-1 / FM-C1 |
| TC-FM-2（移行先不在 404） | FM-2 / FM-C3 |
| TC-FM-3（移行先 非active 409） | FM-3 / FM-C4 |
| TC-FM-4（src===dest 400） | FM-4 / FM-C5 |
| TC-FM-5（衝突吸収・孤児なし） | FM-R2 / FM-R3 |
| TC-FM-6（migratedCount=移行前 source 参照数 実測） | FM-R2 / FM-R4 |
| TC-AC7-1（未指定+参照あり 409 不変） | AC7-1 |
| TC-AC7-2（未指定+参照0 204 不変） | AC7-2 |
| TC-AUDIT-1（migrated before/after） | AUDIT-1 / FM-C2 |

## 6. RED 状態の確認

Phase 5 着手前、以下が **import / 関数未定義・404 で fail** することを確認する（RED）:

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts
```

- 初期 RED 時点では `migrateMemberTagReferences` / `forceMigrateAndPhysicalDeleteTagDefinition` と route `?migrateTo` 分岐が存在しないため、FM-C* は「参照あり → 既存 409」に落ち、移行・audit 2 件・新 error code が成立せず fail する想定。Phase 5（GREEN）で全件 PASS させる。
- **AC7-1/AC7-2 は実装前から PASS** する想定（既存挙動の固定であり退化検知器として機能）。

## 7. 成果物

| 成果物 | パス |
|--------|------|
| repository force-migration ケース追加 | `apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts`（既存に describe 追加・D1 config 必須） |
| route force-migration + AC-7 regression 追加 | `apps/api/src/routes/admin/tags.contract.spec.ts`（既存に describe 追加） |

## 8. targeted run list（Phase 5/6 共通）

```
apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts
apps/api/src/routes/admin/tags.contract.spec.ts
```

# Phase 4: テスト作成（TDD RED）

> 実装区分: **NON_VISUAL**（API only。Phase 11 は `manual-test-result.md` を一次証跡とする）。
> 本 Phase は実装前に **失敗するテスト**を確定する。Phase 5（GREEN）で全件 PASS させる。
> 新規テストファイルは `*.spec.ts` のみ（CLAUDE.md invariant #8）。`*.test.ts` 禁止。
> 各テストに対応 AC を明記し、Phase 3 の C-1..C-5 を全て織り込む。

## 0. 作成するテストファイル（2 本・新規）

| # | パス | 種別 | 検証層 |
|---|------|------|--------|
| 1 | `apps/api/src/routes/admin/tags.contract.spec.ts` | route contract | HTTP 入出力 / status / audit / shape / routing 衝突 |
| 2 | `apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts` | repository unit | write/read 関数の戻り値・冪等・SQL 整合 |

> private method テストは **該当なし**（追加する 5 関数は全て public export）。`canUseTool` 等 SDK 項目も該当なし（API テストのみ）。

## 1. 共通の前提（前例どおりに固定）

- 各 spec の 1 行目に `// @vitest-environment node` を置く（`members.tags.contract.spec.ts` / `memberTags.admin-write.repository.spec.ts` と同一）。
- `setupD1`（`apps/api/src/repository/__tests__/_setup.ts`）で in-memory D1 を構築。migration は `apps/api/migrations/*.sql` を全件適用済み（`tag_definitions` の `active` カラム含む）。
- `beforeEach` は `setupD1()` → seed、timeout `30000`（migration 適用が重いため前例どおり）。
- route 認証は `adminAuthHeader()`（`./_test-auth`）。`TEST_AUTH_SECRET` を `makeEnv` の `AUTH_SECRET` に渡す。
- route spec の `makeEnv` は `members.tags.contract.spec.ts` と同形:

```ts
const makeEnv = (env: InMemoryD1) => ({
  DB: env.db as unknown as D1Database,
  SYNC_ADMIN_TOKEN: "t",
  AUTH_SECRET: TEST_AUTH_SECRET,
});
```

- audit 件数は `audit_log` を直接 SELECT して数える（`target_type='tag'` でフィルタ）。

---

## 2. `apps/api/src/routes/admin/tags.contract.spec.ts`

### 2.1 ヘッダ・import・seed helper

```ts
// @vitest-environment node
// issue-1035: tag master CRUD route の contract spec。
//   GET/POST/PATCH/DELETE /admin/tags の status・audit・shape・routing 衝突を検証する。
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { createAdminTagsRoute } from "./tags";
import { createAdminTagsQueueRoute } from "./tags-queue"; // AC-7 routing regression 用
import { adminAuthHeader, TEST_AUTH_SECRET } from "./_test-auth";

const makeEnv = (env: InMemoryD1) => ({
  DB: env.db as unknown as D1Database,
  SYNC_ADMIN_TOKEN: "t",
  AUTH_SECRET: TEST_AUTH_SECRET,
});

interface TagRow {
  tagId: string;
  code: string;
  label: string;
  category: string;
  active: boolean;
}
interface PagedResponse {
  total: number;
  items: TagRow[];
}

// active=1 / active=0 両方 + member へ付与済み row を seed する。
const seed = async (env: InMemoryD1) => {
  await env.db
    .prepare(
      `INSERT INTO tag_definitions (tag_id, code, label, category, source_stable_keys_json, active)
       VALUES ('tag_eng','engineer','エンジニア','occupation','[]',1),
              ('tag_mgr','manager','経営者','occupation','[]',1),
              ('tag_inact','legacy_code','旧タグ','misc','[]',0)`,
    )
    .run();
  // member_tags 保持確認用に member と付与 row を 1 件投入
  await env.db
    .prepare(
      `INSERT INTO member_identities
       (member_id, response_email, current_response_id, first_response_id, last_submitted_at)
       VALUES ('m1','m1@example.com','r1','r1','2026-04-01T00:00:00Z')`,
    )
    .run();
  await env.db
    .prepare(
      `INSERT INTO member_tags (member_id, tag_id, source, confidence, assigned_by)
       VALUES ('m1','tag_eng','manual',NULL,'admin@example.com')`,
    )
    .run();
};

const auditCount = async (env: InMemoryD1, action: string, targetId?: string): Promise<number> => {
  const sql = targetId
    ? "SELECT COUNT(*) AS n FROM audit_log WHERE target_type='tag' AND action=?1 AND target_id=?2"
    : "SELECT COUNT(*) AS n FROM audit_log WHERE target_type='tag' AND action=?1";
  const stmt = env.db.prepare(sql);
  const bound = targetId ? stmt.bind(action, targetId) : stmt.bind(action);
  const r = await bound.first<{ n: number }>();
  return r?.n ?? 0;
};

const tagDefRow = async (env: InMemoryD1, tagId: string) =>
  env.db
    .prepare("SELECT tag_id, code, label, category, active FROM tag_definitions WHERE tag_id=?1")
    .bind(tagId)
    .first<{ tag_id: string; code: string; label: string; category: string; active: number }>();
```

### 2.2 テストケース一覧（route contract）

各ケースは `createAdminTagsRoute()` を `app.request(path, init, makeEnv(env))` で叩く。

#### AC-1: POST /tags（作成）

| ID | シナリオ | リクエスト | 期待 |
|----|----------|-----------|------|
| R-T1 | 正常作成 | POST `/tags` body `{ code:"biz_food", label:"飲食", category:"industry" }` | `201`。body `{ tagId, code:"biz_food", label:"飲食", category:"industry", active:true }`（`tagId` は string）。`tagDefRow(tagId)` が DB に存在し `active===1` |
| R-T2 | code 重複 → 409 | 既存 `engineer` を再 POST body `{ code:"engineer", label:"X", category:"occupation" }` | `409`。body `{ ok:false, error:"tag_code_conflict" }`。`tag_definitions` の engineer 行は 1 件のまま（増えない） |
| R-T3 | body 不正（code 空）→ 400 | POST body `{ code:"", label:"X", category:"y" }` | `400`。`{ ok:false, error:"invalid_body" }` |
| R-T4 | body 不正（label 欠落）→ 400 | POST body `{ code:"ok_code", category:"y" }` | `400` |
| R-T5 | code 形式違反 → 400 | POST body `{ code:"Bad Code!", label:"x", category:"y" }`（`^[a-z0-9][a-z0-9_]*$` 違反） | `400` |
| R-T6 | invalid JSON → 400 | POST raw body `"{not json"` | `400`。`{ ok:false, error:"invalid_json" }` |
| R-T1-audit | 作成 audit | R-T1 実行後 | `auditCount("admin.tag.created", <新tagId>)===1`。`before` null / `after` に `{code,label,category}`（Phase 6 で JSON 詳細アサート） |

検証コード例（R-T1）:

```ts
it("R-T1 [AC-1]: POST 正常 → 201 + DB persist + audit created 1 件", async () => {
  const app = createAdminTagsRoute();
  const res = await app.request(
    "/tags",
    {
      method: "POST",
      headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
      body: JSON.stringify({ code: "biz_food", label: "飲食", category: "industry" }),
    },
    makeEnv(env),
  );
  expect(res.status).toBe(201);
  const body = (await res.json()) as TagRow;
  expect(body).toMatchObject({ code: "biz_food", label: "飲食", category: "industry", active: true });
  expect(typeof body.tagId).toBe("string");
  const row = await tagDefRow(env, body.tagId);
  expect(row?.active).toBe(1);
  expect(await auditCount(env, "admin.tag.created", body.tagId)).toBe(1);
});
```

#### AC-2: PATCH /tags/:tagId（更新・code immutable）

| ID | シナリオ | リクエスト | 期待 |
|----|----------|-----------|------|
| R-T7 | label/category 更新 | PATCH `/tags/tag_eng` body `{ label:"上級エンジニア", category:"specialist" }` | `200`。body `{ tagId:"tag_eng", code:"engineer", label:"上級エンジニア", category:"specialist", active:true }`。DB 行も更新済 |
| R-T8 | label のみ更新 | PATCH `/tags/tag_eng` body `{ label:"X" }` | `200`。category は元値 `occupation` 維持 |
| R-T9 | 不在 tagId → 404 | PATCH `/tags/nope` body `{ label:"X" }` | `404`。`{ ok:false, error:"tag_not_found" }` |
| R-T10 | 両方未指定 → 400 | PATCH `/tags/tag_eng` body `{}` | `400`。`{ ok:false, error:"no_update_fields" }` |
| R-T11 | **code immutable** | PATCH `/tags/tag_eng` body `{ code:"renamed", label:"X" }` | `200`。レスポンスと DB の `code` は `engineer` のまま（`renamed` にならない）。label のみ反映 → C-3 検証 |
| R-T7-audit | 更新 audit | R-T7 実行後 | `auditCount("admin.tag.updated","tag_eng")===1` |

R-T11 検証コード例（C-3 code immutable）:

```ts
it("R-T11 [AC-2/C-3]: PATCH body に code を入れても無視（code immutable）", async () => {
  const app = createAdminTagsRoute();
  const res = await app.request(
    "/tags/tag_eng",
    {
      method: "PATCH",
      headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
      body: JSON.stringify({ code: "renamed", label: "X" }),
    },
    makeEnv(env),
  );
  expect(res.status).toBe(200);
  const body = (await res.json()) as TagRow;
  expect(body.code).toBe("engineer"); // 変更されない
  expect(body.label).toBe("X");
  const row = await tagDefRow(env, "tag_eng");
  expect(row?.code).toBe("engineer");
});
```

> 実装方針: `UpdateTagBodyZ` は `label`/`category` のみ受理し `code` を schema に含めない（zod が strip）。`code` を含めても無視されるため「無視」挙動を検証する。

#### AC-3: DELETE /tags/:tagId（論理削除 / member_tags 保持 / 冪等）

| ID | シナリオ | リクエスト | 期待 |
|----|----------|-----------|------|
| R-T12 | 論理削除 | DELETE `/tags/tag_eng` | `204`（body なし）。`tagDefRow("tag_eng").active===0` |
| R-T12-mt | member_tags 保持 | R-T12 後 | `SELECT COUNT(*) FROM member_tags WHERE tag_id='tag_eng'` が依然 1（行は消えない）→ C-4 検証 |
| R-T12-audit | 削除 audit | R-T12 後 | `auditCount("admin.tag.deactivated","tag_eng")===1` |
| R-T13 | 不在 → 404 | DELETE `/tags/nope` | `404`。`{ ok:false, error:"tag_not_found" }` |
| R-T14 | 既 inactive 再送（冪等）| 既に active=0 の `tag_inact` を DELETE | `204`。`auditCount("admin.tag.deactivated","tag_inact")===0`（audit 増えない）→ C-5 検証 |
| R-T14b | 二度 DELETE | `tag_eng` を 2 回 DELETE | 2 回とも `204`。`auditCount("admin.tag.deactivated","tag_eng")===1`（1 回目のみ audit） |

R-T12 + member_tags 保持の検証コード例:

```ts
it("R-T12 [AC-3/C-4]: DELETE → 204 + active=0 + member_tags 保持 + audit 1 件", async () => {
  const app = createAdminTagsRoute();
  const res = await app.request(
    "/tags/tag_eng",
    { method: "DELETE", headers: { ...(await adminAuthHeader()) } },
    makeEnv(env),
  );
  expect(res.status).toBe(204);
  const row = await tagDefRow(env, "tag_eng");
  expect(row?.active).toBe(0);
  const mt = await env.db
    .prepare("SELECT COUNT(*) AS n FROM member_tags WHERE tag_id='tag_eng'")
    .first<{ n: number }>();
  expect(mt?.n).toBe(1); // member_tags 行は保持
  expect(await auditCount(env, "admin.tag.deactivated", "tag_eng")).toBe(1);
});
```

#### AC-4: GET /tags（pagination + search、inactive 含む）

| ID | シナリオ | リクエスト | 期待 |
|----|----------|-----------|------|
| R-T15 | 一覧 shape | GET `/tags` | `200`。`{ total:number, items:TagRow[] }`。`items` に active/inactive 両方含む（`legacy_code` も出る）。`total===3` |
| R-T16 | q 部分一致 | GET `/tags?q=eng` | `200`。`items` の code が `engineer` を含むものに絞られる（`total` も絞られる） |
| R-T17 | q 大小無視 | GET `/tags?q=ENG` | R-T16 と同件（LOWER 比較） |
| R-T18 | pagination | GET `/tags?page=1&pageSize=2` | `200`。`items.length===2`、`total===3` |
| R-T19 | page=2 | GET `/tags?page=2&pageSize=2` | `200`。`items.length===1`、`total===3` |
| R-T20 | inactive を含む | GET `/tags?q=legacy` | `items` に `legacy_code`（active=0）が含まれる（master ビューは inactive も表示）|

```ts
it("R-T15 [AC-4]: GET → { total, items }（inactive も含む）", async () => {
  const app = createAdminTagsRoute();
  const res = await app.request(
    "/tags",
    { method: "GET", headers: { ...(await adminAuthHeader()) } },
    makeEnv(env),
  );
  expect(res.status).toBe(200);
  const body = (await res.json()) as PagedResponse;
  expect(body.total).toBe(3);
  const codes = body.items.map((t) => t.code);
  expect(codes).toContain("engineer");
  expect(codes).toContain("legacy_code"); // active=0 も含む
});
```

#### AC-5: audit のターゲット種別・件数

| ID | シナリオ | 期待 |
|----|----------|------|
| R-T21 | targetType=tag | create/update/deactivate いずれの audit row も `target_type='tag'`。`SELECT DISTINCT target_type` で `tag` を確認 |
| R-T22 | state 変化時のみ | no-op PATCH（同値）では audit 増えない（Phase 6 で詳細化）。本 Phase は create/update/delete それぞれ 1 件を確認 |

#### AC-7 regression: 既存 routing / available

| ID | シナリオ | リクエスト | 期待 |
|----|----------|-----------|------|
| R-T23 | `/tags/queue` 非衝突 | `createAdminTagsQueueRoute()` に GET `/tags/queue` | `200`。`{ total, items }`。新 `/tags/:tagId` が `/tags/queue` を飲み込まないこと（C-2）。**注**: 本ファイルでは queue route と tags route は別 app instance のため衝突しないが、`index.ts` の mount 順検証は Phase 6 の統合 regression で扱う |
| R-T24 | `/tags/queue` を tags route で叩いた場合 | `createAdminTagsRoute()` に GET `/tags/queue` | `queue` を `:tagId` として受理しても `getTagDefinitionByIdRaw("queue")` は不在 → 一覧 GET ではないため、ここでは「tags route 単体に `/tags/queue` は存在しない」ことを確認（404 or 該当 handler なし）。最終的な優先順位は index 統合 test（Phase 6）で担保 |
| R-T25 | available 不変 | seed の member へ `getTagDefinitionMaster` 相当（`createAdminMembersRoute` の GET `/members/m1/tags`）で `available` が active=1 全件（engineer/manager、inactive 除外）であること | `members.tags.contract.spec.ts` の A-T10 を回帰として再走（既存ファイルで担保。本ファイルからは参照のみ言及） |

> R-T25 は既存 `members.tags.contract.spec.ts` の A-T10 が担保するため、本ファイルでは重複実装しない（targeted run list に両ファイルを含める）。

#### authz regression

| ID | シナリオ | 期待 |
|----|----------|------|
| R-T26 | 未認証 401 | GET `/tags` を Authorization 無しで | `401`（`requireAdmin` middleware） |
| R-T27 | 非 admin 401/403 | `memberAuthHeader()`（`isAdmin:false`）で GET `/tags` | `requireAdmin` の既存挙動に従う（401 系）。期待値は `requireAdmin` の現挙動に合わせる |

---

## 3. `apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts`

### 3.1 ヘッダ・import・seed

```ts
// @vitest-environment node
// issue-1035: tag master write 関数の unit spec。
//   in-memory D1（setupD1）で create/update/deactivate/list/getById の戻り値と冪等を検証する。
//   （既存 tagDefinitions の read 関数は d1mock ベースの別 spec なので write は本ファイルへ分離）
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "./_setup";
import {
  createTagDefinition,
  updateTagDefinition,
  deactivateTagDefinition,
  listTagDefinitionsPaged,
  getTagDefinitionByIdRaw,
} from "../tagDefinitions";

// active=1 / active=0 両方 + member へ付与済み row を seed する。
const seed = async (env: InMemoryD1) => {
  await env.db
    .prepare(
      `INSERT INTO tag_definitions (tag_id, code, label, category, source_stable_keys_json, active)
       VALUES ('tag_eng','engineer','エンジニア','occupation','[]',1),
              ('tag_mgr','manager','経営者','occupation','[]',1),
              ('tag_inact','legacy_code','旧タグ','misc','[]',0)`,
    )
    .run();
  await env.db
    .prepare(
      `INSERT INTO member_identities
       (member_id, response_email, current_response_id, first_response_id, last_submitted_at)
       VALUES ('m1','m1@example.com','r1','r1','2026-04-01T00:00:00Z')`,
    )
    .run();
  await env.db
    .prepare(
      `INSERT INTO member_tags (member_id, tag_id, source, confidence, assigned_by)
       VALUES ('m1','tag_eng','manual',NULL,'admin@example.com')`,
    )
    .run();
};

describe("tagDefinitions write repository (issue-1035)", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
    await seed(env);
  }, 30000);
  // ... cases ...
});
```

### 3.2 テストケース一覧（repository unit）

#### `createTagDefinition`

| ID | シナリオ | 期待 |
|----|----------|------|
| W-C1 [AC-1] | 新規 ok | `createTagDefinition(env.ctx, { code:"biz_food", label:"飲食", category:"industry" })` → `{ ok:true, row }`。`row.code==="biz_food"`、`row.active===true`、`row.tagId` は string（UUID）。`getTagDefinitionByIdRaw` で再取得でき `sourceStableKeysJson==="[]"` |
| W-C2 [AC-1] | code 衝突 | 既存 `engineer` で create → `{ ok:false, reason:"code_conflict" }`。`tag_definitions` の engineer 行は 1 件のまま |

```ts
it("W-C1 [AC-1]: createTagDefinition 新規 → ok + active=1 + UUID tagId", async () => {
  const r = await createTagDefinition(env.ctx, { code: "biz_food", label: "飲食", category: "industry" });
  expect(r.ok).toBe(true);
  if (r.ok) {
    expect(r.row.code).toBe("biz_food");
    expect(r.row.active).toBe(true);
    expect(typeof r.row.tagId).toBe("string");
    const again = await getTagDefinitionByIdRaw(env.ctx, r.row.tagId);
    expect(again?.sourceStableKeysJson).toBe("[]");
  }
});

it("W-C2 [AC-1]: code 衝突 → reason:code_conflict", async () => {
  const r = await createTagDefinition(env.ctx, { code: "engineer", label: "X", category: "occupation" });
  expect(r).toEqual({ ok: false, reason: "code_conflict" });
});
```

#### `updateTagDefinition`

| ID | シナリオ | 期待 |
|----|----------|------|
| W-U1 [AC-2] | label/category 更新 | `updateTagDefinition(env.ctx,"tag_eng",{label:"L2",category:"C2"})` → row（`code` は `engineer` のまま、label/category 更新済） |
| W-U2 [AC-2] | label のみ | `{label:"L2"}` → category は `occupation` 維持 |
| W-U3 [AC-2] | 不在 → null | `updateTagDefinition(env.ctx,"nope",{label:"X"})` → `null` |
| W-U4 [AC-2] | no-op（空 input）| `updateTagDefinition(env.ctx,"tag_eng",{})` → 現行 row をそのまま返す（label/category 不変、null ではない） |
| W-U5 [AC-2/C-3] | active 不変 | inactive な `tag_inact` を update しても `active===false` のまま（update は active を触らない） |

#### `deactivateTagDefinition`

| ID | シナリオ | 期待 |
|----|----------|------|
| W-D1 [AC-3] | active1→0 changed:true | `deactivateTagDefinition(env.ctx,"tag_eng")` → `{ row, changed:true }`。`row.active===false`。DB 行も active=0 |
| W-D2 [AC-3/C-5] | 既 inactive changed:false | `deactivateTagDefinition(env.ctx,"tag_inact")` → `{ row, changed:false }`。`row.active===false` |
| W-D3 [AC-3] | 不在 → null | `deactivateTagDefinition(env.ctx,"nope")` → `null` |
| W-D4 [AC-3/C-4] | member_tags 保持 | W-D1 後、`SELECT COUNT(*) FROM member_tags WHERE tag_id='tag_eng'` が 1 のまま |

```ts
it("W-D1 [AC-3]: active=1→0 で changed:true + DB active=0", async () => {
  const r = await deactivateTagDefinition(env.ctx, "tag_eng");
  expect(r).not.toBeNull();
  expect(r?.changed).toBe(true);
  expect(r?.row.active).toBe(false);
});

it("W-D4 [AC-3/C-4]: deactivate しても member_tags 行は保持", async () => {
  await deactivateTagDefinition(env.ctx, "tag_eng");
  const mt = await env.db
    .prepare("SELECT COUNT(*) AS n FROM member_tags WHERE tag_id='tag_eng'")
    .first<{ n: number }>();
  expect(mt?.n).toBe(1);
});
```

#### `listTagDefinitionsPaged`

| ID | シナリオ | 期待 |
|----|----------|------|
| W-L1 [AC-4] | total/items | `listTagDefinitionsPaged(env.ctx,{page:1,pageSize:50})` → `total===3`、`items.length===3`（inactive 含む） |
| W-L2 [AC-4] | q 部分一致 | `{q:"eng",page:1,pageSize:50}` → engineer に絞られ `total` も絞られる |
| W-L3 [AC-4] | q 大小無視 | `{q:"ENG",...}` は W-L2 と同件 |
| W-L4 [AC-4] | page 区切り | `{page:1,pageSize:2}` → items 2 件 / total 3、`{page:2,pageSize:2}` → items 1 件 / total 3 |

#### `getTagDefinitionByIdRaw`

| ID | シナリオ | 期待 |
|----|----------|------|
| W-G1 [AC-2/3] | active 取得 | `getTagDefinitionByIdRaw(env.ctx,"tag_eng")` → row（active=true） |
| W-G2 [AC-2/3] | **inactive も取得** | `getTagDefinitionByIdRaw(env.ctx,"tag_inact")` → row（active=false、null にならない）。これが `findTagDefinitionById`（active=1 限定）と異なる点 |
| W-G3 | 不在 → null | `getTagDefinitionByIdRaw(env.ctx,"nope")` → `null` |

---

## 4. RED 状態の確認

Phase 5 着手前、以下が **import / 関数未定義で fail** することを確認する（RED）:

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- \
  src/routes/admin/tags.contract.spec.ts \
  src/repository/__tests__/tagDefinitions.write.repository.spec.ts
```

- 初期 RED 時点では `createAdminTagsRoute` / `createTagDefinition` 等が未実装のため module resolution / 関数未定義で fail する想定だった。Phase 11 時点では実装済みで、focused D1 Vitest は PASS。

## 5. targeted run list（Phase 5/6 共通）

```
apps/api/src/routes/admin/tags.contract.spec.ts
apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts
apps/api/src/routes/admin/members.tags.contract.spec.ts        # AC-7 available regression
apps/api/src/repository/__tests__/auditLog.repository.spec.ts   # audit regression
```

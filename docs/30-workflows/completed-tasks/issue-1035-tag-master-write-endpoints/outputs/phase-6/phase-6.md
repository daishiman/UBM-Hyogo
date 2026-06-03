# Phase 6: テスト拡充

> Phase 4（基本 RED/GREEN）の後、fail path・回帰 guard・境界条件を追加してカバレッジを引き上げる。
> 追加先は Phase 4 で作成した 2 ファイル（`tags.contract.spec.ts` / `tagDefinitions.write.repository.spec.ts`）
> + index 統合 regression 用に既存 contract spec パターンを再利用する。
> 「ガード節の全 falsy パターン列挙」（UT-W3-HTTP 教訓）を徹底する。

## 1. 入力境界（zod / SQL）— `tags.contract.spec.ts` / repository spec へ追加

### 1.1 category / label の境界

| ID | 対象 | 入力 | 期待 |
|----|------|------|------|
| E-B1 | POST label max | `label` = 121 文字（max 120 超過） | `400 invalid_body` |
| E-B2 | POST label 境界 ok | `label` = ちょうど 120 文字 | `201`（受理） |
| E-B3 | POST label 空 | `label` = `""` | `400`（`min(1)`） |
| E-B4 | POST category max | `category` = 65 文字（max 64 超過） | `400` |
| E-B5 | POST category 空 | `category` = `""` | `400` |
| E-B6 | POST code max | `code` = 65 文字 | `400` |
| E-B7 | POST 制御文字 label | `label` = `"a\u0000b"` | 現 schema は `min/max` のみで制御文字を弾かない → **受理される（201）**。本ケースは「現仕様では拒否しない」ことを明示テストし、将来の sanitize 要否を記録（issue follow-up 候補） |
| E-B8 | PATCH label max | PATCH `{ label: 121文字 }` | `400` |
| E-B9 | PATCH category 空 | PATCH `{ category: "" }` | `400`（`min(1)`、refine 前に弾く） |

> **E-B7 の判断**: 制御文字 sanitize は本 issue スコープ外（DB は TEXT で格納可、表示側エスケープは UI 責務）。「弾かない」を明示テストにし、想定外の挙動変化を検知する回帰 guard とする。

### 1.2 q の特殊文字（LIKE ワイルドカード）

| ID | 対象 | 入力 | 期待・検討 |
|----|------|------|-----------|
| E-Q1 | q に `%` | seed に `code="biz_food"` 等。GET `/tags?q=%25`（URL エンコードされた `%`） | **要検討**: 現実装は `%${q}%` で q を素通しするため、q 内の `%`/`_` は LIKE のワイルドカードとして解釈される。q=`%` は全件マッチに退化する |
| E-Q2 | q に `_` | GET `/tags?q=b_z`（`_` は任意 1 文字） | `b` + 任意 + `z` にマッチし得る |

**LIKE エスケープ要否の決定**:
- 現規模（tag master は数十件）かつ admin 専用 UI 検索のため、ワイルドカード解釈は**実害が小さい**（DoS にならない・情報漏洩にならない）。
- 厳密な部分一致を保証するには `ESCAPE` 句が必要（例: `LIKE ?1 ESCAPE '\'` + q 内の `%`/`_`/`\` を `\` でエスケープ）。
- **本 issue の決定**: **エスケープしない**（最小実装。q はあくまで利便性検索）。E-Q1/E-Q2 は「現仕様ではワイルドカードが効く」ことを明示テストし、将来 strict 検索が要件化されたら別タスクで `ESCAPE` を導入する旨を spec に記録。
- テストは「q=`%` で 500 にならず 200 を返す（クラッシュしない）」を最低保証とする。

```ts
it("E-Q1: q に % を含めても 500 にならず 200（クラッシュ耐性）", async () => {
  const app = createAdminTagsRoute();
  const res = await app.request(
    "/tags?q=%25", // URL-encoded '%'
    { method: "GET", headers: { ...(await adminAuthHeader()) } },
    makeEnv(env),
  );
  expect(res.status).toBe(200);
});
```

### 1.3 pagination 境界

| ID | 対象 | 入力 | 期待 |
|----|------|------|------|
| E-P1 | pageSize 上限超過 | GET `/tags?pageSize=101`（max 100 超過） | `400 invalid_query`（zod `max(100)`） |
| E-P2 | pageSize 境界 ok | GET `/tags?pageSize=100` | `200` |
| E-P3 | page=0 | GET `/tags?page=0`（min 1 違反） | `400 invalid_query` |
| E-P4 | page 負値 | GET `/tags?page=-1` | `400` |
| E-P5 | page 非整数 | GET `/tags?page=1.5` | `400`（`int()`） |
| E-P6 | page 文字列 | GET `/tags?page=abc` | `400`（`coerce` 失敗） |
| E-P7 | 範囲外 page（空ページ）| 全 3 件で GET `/tags?page=99&pageSize=50` | `200`。`items` 空配列、`total===3`（total は page に依存しない） |

---

## 2. 存在しない tagId への PATCH/DELETE（fail path）

| ID | 対象 | 入力 | 期待 |
|----|------|------|------|
| E-N1 | PATCH 不在 | PATCH `/tags/does-not-exist` `{ label:"X" }` | `404 tag_not_found`。audit `admin.tag.updated` は 0 件 |
| E-N2 | DELETE 不在 | DELETE `/tags/does-not-exist` | `404 tag_not_found`。audit `admin.tag.deactivated` は 0 件 |
| E-N3 | PATCH 不在で audit 無し | E-N1 後 `auditCount("admin.tag.updated")===0` |

---

## 3. audit の JSON 内容アサート（before/after）

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
| E-A1 | created after | POST `{code:"biz_food",label:"飲食",category:"industry"}` 後、`admin.tag.created` の `before_json` は null、`after_json` を JSON.parse すると `{ code:"biz_food", label:"飲食", category:"industry" }` |
| E-A2 | updated before/after | `tag_eng`（label=エンジニア/category=occupation）を PATCH `{label:"上級",category:"specialist"}` 後、`admin.tag.updated` の `before_json` parse = `{label:"エンジニア",category:"occupation"}`、`after_json` parse = `{label:"上級",category:"specialist"}` |
| E-A3 | deactivated before/after | `tag_eng` DELETE 後、`admin.tag.deactivated` の `before_json` parse = `{active:true}`、`after_json` parse = `{active:false}` |

```ts
it("E-A2: PATCH の audit before/after が変更前後を正確に記録", async () => {
  const app = createAdminTagsRoute();
  await app.request(
    "/tags/tag_eng",
    {
      method: "PATCH",
      headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
      body: JSON.stringify({ label: "上級", category: "specialist" }),
    },
    makeEnv(env),
  );
  const row = await auditRow(env, "admin.tag.updated", "tag_eng");
  expect(JSON.parse(row!.before_json!)).toEqual({ label: "エンジニア", category: "occupation" });
  expect(JSON.parse(row!.after_json!)).toEqual({ label: "上級", category: "specialist" });
});
```

---

## 4. audit 冪等（state 変化なし → append しない）— C-5 詳細

| ID | シナリオ | 期待 |
|----|----------|------|
| E-I1 | no-op PATCH（同値）| `tag_eng` を `{ label:"エンジニア" }`（現値と同一）で PATCH | `200`。`auditCount("admin.tag.updated","tag_eng")===0`（before===after で append しない）|
| E-I2 | no-op PATCH 部分 | category だけ同値、label を変更 → audit 1 件（label が変わっているため append される） |
| E-I3 | 二度 DELETE | `tag_eng` を 2 回 DELETE → 両方 204、`auditCount("admin.tag.deactivated","tag_eng")===1` |
| E-I4 | 既 inactive DELETE | `tag_inact`（active=0）DELETE → 204、`auditCount("admin.tag.deactivated","tag_inact")===0` |

```ts
it("E-I1 [C-5]: 同値 PATCH では audit を増やさない", async () => {
  const app = createAdminTagsRoute();
  const res = await app.request(
    "/tags/tag_eng",
    {
      method: "PATCH",
      headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
      body: JSON.stringify({ label: "エンジニア" }), // seed と同値
    },
    makeEnv(env),
  );
  expect(res.status).toBe(200);
  expect(await auditCount(env, "admin.tag.updated", "tag_eng")).toBe(0);
});
```

---

## 5. routing 優先順位 regression（C-2）— index 統合 test

`/tags` と `/tags/queue` の優先順位を **index.ts の mount 順込み**で検証する新規 spec。

**新規ファイル候補**: `apps/api/src/routes/admin/tags.routing.contract.spec.ts`
（Phase 4 の inventory に加える。`*.spec.ts` 命名厳守。`tags.contract.spec.ts` 内の describe ブロック追加でも可だが、両 route を同一 app に mount するため別ファイルが明快）

> **方針**: `index.ts` の `app` 全体を import するとテスト env 構築が重い。代わりに `members.tags.contract.spec.ts` と同様、`createAdminTagsQueueRoute()` と `createAdminTagsRoute()` を **同じ順序（queue → tags）で 1 つの親 Hono に mount** して優先順位を再現する。

```ts
// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { createAdminTagsQueueRoute } from "./tags-queue";
import { createAdminTagsRoute } from "./tags";
import { adminAuthHeader, TEST_AUTH_SECRET } from "./_test-auth";

const makeEnv = (env: InMemoryD1) => ({
  DB: env.db as unknown as D1Database,
  SYNC_ADMIN_TOKEN: "t",
  AUTH_SECRET: TEST_AUTH_SECRET,
});

// index.ts と同じ mount 順（queue → tags）を再現
const buildApp = () => {
  const app = new Hono();
  app.route("/admin", createAdminTagsQueueRoute());
  app.route("/admin", createAdminTagsRoute());
  return app;
};
```

| ID | シナリオ | 期待 |
|----|----------|------|
| E-R1 | `/tags/queue` 優先 | mount 順 queue→tags で GET `/admin/tags/queue` | `200`。`{ total, items }`（queue route が処理。`:tagId="queue"` に飲まれない）|
| E-R2 | `/tags` 通常 | GET `/admin/tags` | `200`。`{ total, items }`（tags route が処理） |
| E-R3 | `/tags/:tagId` 通常 | seed の `tag_eng` を DELETE `/admin/tags/tag_eng` | `204`（tags route が処理） |
| E-R4 | queue resolve 非衝突 | POST `/admin/tags/queue/<id>/resolve` が tags route の `:tagId` に飲まれない | queue route のバリデーション挙動に到達（404/400 等。tags route の handler に来ない） |

```ts
it("E-R1 [C-2]: queue→tags mount 順で /tags/queue が queue route に届く", async () => {
  const env = await setupD1();
  const res = await buildApp().request(
    "/admin/tags/queue",
    { method: "GET", headers: { ...(await adminAuthHeader()) } },
    makeEnv(env),
  );
  expect(res.status).toBe(200);
  const body = (await res.json()) as { total: number; items: unknown[] };
  expect(Array.isArray(body.items)).toBe(true);
});
```

> **注**: `tags-queue` route は `tagQueueProvider` 等を要求する。`writeTagNoteProviderMiddleware` が provider を bind するため、`makeEnv` に DB を渡せば middleware が `c.env.DB` から provider を生成する。GET `/tags/queue` が provider 解決まで到達して 200 を返せれば C-2 を満たす。

---

## 6. deactivate 後の `getTagDefinitionMaster` からの消失（AC-3 / AC-7 整合）

deactivate（active=0）した tag が available 一覧から消えることを repository / route 両層で検証。

| ID | 層 | シナリオ | 期待 |
|----|----|----------|------|
| E-M1 | repository | `tag_eng` を `deactivateTagDefinition` した後 `getTagDefinitionMaster(env.ctx)`（`memberTags.ts`）を呼ぶ | 返り値 codes に `engineer` が **含まれない**（active=1 フィルタで除外） |
| E-M2 | repository | 同上で `listAssignedTagsForMember(env.ctx, "m1")` | member m1 に付与済みだった `tag_eng` も active=0 のため available/assigned（active=1 JOIN）から消える。ただし `member_tags` 行は物理的に残存（`SELECT COUNT` で確認） |
| E-M3 | route | tags route の GET `/tags`（master ビュー） | deactivate 後も `legacy_code` 同様に `engineer`（active=0）が **含まれる**（master ビューは inactive も表示）。E-M1（available）と E-M3（master）で表示集合が異なることを対比検証 |

```ts
it("E-M1 [AC-3/AC-7]: deactivate 後 getTagDefinitionMaster から消える", async () => {
  const { getTagDefinitionMaster } = await import("../memberTags");
  await deactivateTagDefinition(env.ctx, "tag_eng");
  const master = await getTagDefinitionMaster(env.ctx);
  expect(master.map((t) => t.code)).not.toContain("engineer");
});
```

> E-M1/E-M2 は repository spec（`tagDefinitions.write.repository.spec.ts`）へ。E-M3 は contract spec へ。`memberTags.ts` の `getTagDefinitionMaster` / `listAssignedTagsForMember` は **import して読むだけ**（変更しない）。

---

## 7. ガード節の全 falsy パターン列挙（UT-W3-HTTP 教訓）

route の各ガード節を falsy 入力で網羅する。

### 7.1 POST /tags のガード

| ガード | falsy パターン | 期待 |
|--------|---------------|------|
| `c.req.json()` throw | 空 body / `"{"` / 非 JSON テキスト | `400 invalid_json` |
| `CreateTagBodyZ` 失敗 | `{}` / `{code:""}` / `{code:"x"}`（label 欠落）/ `{code:null}` / `{code:"A_B"}`（大文字違反）/ `{code:"_lead"}`（先頭 `_` 違反 `^[a-z0-9]`）| 全て `400 invalid_body` |
| `createTagDefinition` conflict | 既存 code | `409 tag_code_conflict` |

| ID | 入力 | 期待 |
|----|------|------|
| E-G1 | POST 空 body（`body` 省略）| `400 invalid_json`（`c.req.json()` が throw）|
| E-G2 | POST `{ code:null, label:"x", category:"y" }` | `400 invalid_body` |
| E-G3 | POST `{ code:"_x", label:"x", category:"y" }`（先頭 `_`） | `400`（`^[a-z0-9]` 違反）|
| E-G4 | POST `{ code:"x", label:"x", category:"y" }` を 2 回 | 1 回目 201 / 2 回目 409 |

### 7.2 PATCH /tags/:tagId のガード

| ガード | falsy パターン | 期待 |
|--------|---------------|------|
| `tagId` param | 空（route 上発生しないが防御） | `400 missing_tagId`（理論上）|
| `c.req.json()` throw | 非 JSON | `400 invalid_json` |
| `UpdateTagBodyZ` 失敗（refine） | `{}` / `{label:undefined,category:undefined}` 相当 | `400 no_update_fields` |
| `UpdateTagBodyZ` 失敗（型） | `{label:""}` / `{label:123}` / `{category:""}` | `400 invalid_body` |
| `getTagDefinitionByIdRaw` null | 不在 tagId | `404 tag_not_found` |

| ID | 入力 | 期待 |
|----|------|------|
| E-G5 | PATCH `{}` | `400 no_update_fields` |
| E-G6 | PATCH `{ label:"" }` | `400 invalid_body`（`min(1)` で refine 前に弾く）|
| E-G7 | PATCH `{ label:123 }`（型違反）| `400 invalid_body` |
| E-G8 | PATCH 不在 tagId + 正常 body | `404 tag_not_found` |

### 7.3 DELETE /tags/:tagId のガード

| ガード | falsy パターン | 期待 |
|--------|---------------|------|
| `deactivateTagDefinition` null | 不在 tagId | `404 tag_not_found` |
| changed=false | 既 inactive | `204`（audit 無し）|

| ID | 入力 | 期待 |
|----|------|------|
| E-G9 | DELETE 不在 tagId | `404 tag_not_found` |
| E-G10 | DELETE 既 inactive | `204`、audit 0 件 |

### 7.4 GET /tags のガード

| ID | 入力 | 期待 |
|----|------|------|
| E-G11 | `?page=0` / `?page=-1` / `?page=abc` / `?pageSize=0` / `?pageSize=101` | 全て `400 invalid_query` |
| E-G12 | query 無し | `200`（page=1/pageSize=50 default）|

---

## 8. repository 層の追加境界（`tagDefinitions.write.repository.spec.ts`）

| ID | 対象 | シナリオ | 期待 |
|----|------|----------|------|
| E-RW1 | `updateTagDefinition` no-op | `{}` 渡し | 現行 row をそのまま返す（label/category 不変、null でない）|
| E-RW2 | `updateTagDefinition` active 不変 | inactive な `tag_inact` を label 更新 | 戻り row の `active===false`（update は active を触らない）|
| E-RW3 | `listTagDefinitionsPaged` 空結果 | q にマッチ無し（`q="zzzzz"`）| `{ total:0, items:[] }` |
| E-RW4 | `listTagDefinitionsPaged` ORDER | 複数件で category ASC, label ASC 順 | items の並びが安定（決定論）|
| E-RW5 | `createTagDefinition` UUID 一意 | 2 回 create（別 code）| `tagId` が互いに異なる |
| E-RW6 | `getTagDefinitionByIdRaw` vs `findByCode` | inactive tag | `getTagDefinitionByIdRaw` は返す / 既存 `findByCode`（active 制約なし）も code で返す。inactive を「id で引ける」ことを明示 |

---

## 9. 回帰 guard（既存 surface 不変）

| ID | 対象 | 期待 |
|----|------|------|
| E-RG1 | `members.tags.contract.spec.ts` A-T10 | available が active=1 全件（inactive 除外）— 既存ファイルで担保。targeted run に含める |
| E-RG2 | `auditLog.repository.spec.ts` | `AuditTargetType` に `"tag"` 追加が既存 audit append/list を壊さない（append-only 不変）— 既存ファイルで担保 |
| E-RG3 | tag master read 関数 | `listAllTagDefinitions` / `listByCategory` / `findByCode` の挙動不変（write 追加で read が変わらない）— 既存 read spec で担保 |

---

## 10. 拡充後の targeted run

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- \
  src/routes/admin/tags.contract.spec.ts \
  src/routes/admin/tags.routing.contract.spec.ts \
  src/repository/__tests__/tagDefinitions.write.repository.spec.ts \
  src/routes/admin/members.tags.contract.spec.ts \
  src/repository/__tests__/auditLog.repository.spec.ts
```

全件 PASS を Phase 6 完了条件とする。`tags.routing.contract.spec.ts` は本 Phase で inventory に追加した新規ファイル（`*.spec.ts` 命名）。

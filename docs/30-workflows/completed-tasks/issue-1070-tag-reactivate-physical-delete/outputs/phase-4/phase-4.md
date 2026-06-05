# Phase 4: テスト作成（TDD RED）

> 実装区分: **NON_VISUAL**（API only。Phase 11 は `manual-test-result.md` を一次証跡とする）。
> 本 Phase は実装前に **失敗するテスト**を確定する。Phase 5（GREEN）で全件 PASS させる。
> 新規テストファイルは `*.spec.ts` のみ（CLAUDE.md invariant #8）。`*.test.ts` 禁止。
> Phase 2/3 の凍結契約（reactivate / physical delete / 参照ガード / audit）を SSOT として全て織り込む。

## 0. 作成するテストファイル（2 本・新規）+ 回帰（1 本・既存）

| # | パス | 種別 | 検証層 | config |
|---|------|------|--------|--------|
| 1 | `apps/api/src/repository/__tests__/tagDefinitions.lifecycle.repository.spec.ts` | repository unit | reactivate / countMemberTagReferences / physicalDelete の戻り値・冪等・SQL 整合 | **`vitest.d1.config.ts` 必須**（in-memory D1） |
| 2 | `apps/api/src/routes/admin/tags.lifecycle.contract.spec.ts` | route contract | reactivate / physical の HTTP status・audit・referenceCount・body | D1 fixture（route も D1 経由） |
| 3 | `apps/api/src/routes/admin/tags.contract.spec.ts`（既存） | regression | 既存 logical DELETE `/tags/:tagId`(active=0) 非破壊（AC-6） | 既存に describe 追加 |

> private method テストは **該当なし**（追加する 3 関数 `reactivateTagDefinition` / `countMemberTagReferences` / `physicalDeleteTagDefinition` は全て public export）。`canUseTool` 等 SDK 項目も該当なし（API テストのみ）。

## 1. D1 config 必須の注記（重要）

repository spec（#1）は **必ず `vitest.d1.config.ts` で実行する**。`physicalDeleteTagDefinition` は実 `DELETE FROM tag_definitions` を発行し、`countMemberTagReferences` は `member_tags` の実 COUNT を読むため、d1mock では参照ガードの分岐を検証できない。route spec（#2）も `setupD1()` 経由で実 D1 を組む。検証コマンドは Phase 全体共通:

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/tagDefinitions.lifecycle.repository.spec.ts \
  apps/api/src/routes/admin/tags.lifecycle.contract.spec.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts
```

## 2. 共通の前提（既存 tag spec に揃える）

- 各 spec 1 行目に `// @vitest-environment node`（`tagDefinitions.write.repository.spec.ts` / `tags.contract.spec.ts` と同一）。
- `setupD1`（`apps/api/src/repository/__tests__/_setup.ts`）で in-memory D1 を構築。migration は `apps/api/migrations/*.sql` を全件適用済み（`tag_definitions.active` カラム・`member_tags` テーブル含む）。**migration 追加は不要**（Phase 2 §2.5）。
- `beforeEach` は `setupD1()` → seed、timeout `30000`（migration 適用が重いため前例どおり）。
- route 認証は `adminAuthHeader()`（`./_test-auth`）。`TEST_AUTH_SECRET` を `makeEnv` の `AUTH_SECRET` に渡す（`tags.contract.spec.ts` と同形）。
- audit 件数は `audit_log` を直接 SELECT して数える（`target_type='tag'` フィルタ）。

### 2.1 共通 seed（active / inactive / 参照あり inactive の 3 状態を用意）

physical delete の「参照あり拒否」と「参照0で削除可」を両方検証するため、**参照ありの inactive tag** と **参照0の inactive tag** を別々に seed する。

```ts
const seed = async (env: InMemoryD1) => {
  await env.db
    .prepare(
      `INSERT INTO tag_definitions (tag_id, code, label, category, source_stable_keys_json, active)
       VALUES ('tag_active','engineer','エンジニア','occupation','[]',1),
              ('tag_inact_ref','legacy_ref','参照あり旧タグ','misc','[]',0),
              ('tag_inact_free','legacy_free','参照なし旧タグ','misc','[]',0)`,
    )
    .run();
  // tag_inact_ref のみ member へ付与（physical delete を 409 で拒否させる）
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
       VALUES ('m1','tag_inact_ref','manual',NULL,'admin@example.com')`,
    )
    .run();
};
```

> seed 状態の意味:
> - `tag_active`（active=1, 参照0）— reactivate idempotent no-op の対象
> - `tag_inact_ref`（active=0, 参照1）— reactivate 成功 + physical delete 409 の対象
> - `tag_inact_free`（active=0, 参照0）— physical delete 204 成功 + code 解放再作成の対象

---

## 3. `tagDefinitions.lifecycle.repository.spec.ts`（repository unit）

### 3.1 ヘッダ・import

```ts
// @vitest-environment node
// issue-1070: tag lifecycle（reactivate / physical delete）repository unit spec。
//   in-memory D1（setupD1）で reactivate の冪等・countMemberTagReferences・physicalDelete の
//   参照ガードと戻り値（PhysicalDeleteTagDefinitionResult 判別共用体）を検証する。
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "./_setup";
import {
  reactivateTagDefinition,
  countMemberTagReferences,
  physicalDeleteTagDefinition,
  createTagDefinition,
  getTagDefinitionByIdRaw,
} from "../tagDefinitions";
```

> `env.ctx` は `setupD1()` の戻り値が提供する DbCtx（既存 `tagDefinitions.write.repository.spec.ts` と同じ呼び方）。直アクセス確認は `env.db.prepare(...)`。

### 3.2 `reactivateTagDefinition` ケース

| ID | シナリオ | arrange / act | assert（期待値） |
|----|----------|---------------|-----------------|
| L-R1 | inactive→active 成功（changed:true） | `tag_inact_ref`（active=0）を reactivate | `{ row, changed:true }`。`row.active===true`。`env.db` 直読で `tag_definitions.active===1` |
| L-R2 | 既 active idempotent no-op | `tag_active`（active=1）を reactivate | `{ row, changed:false }`。`row.active===true`。UPDATE 発行されず DB 不変 |
| L-R3 | 不在 → null | `reactivateTagDefinition(env.ctx,"nope")` | `null` |
| L-R4 | code conflict 構造的不在 | 別 active tag `engineer` が既存の状態で `tag_inact_ref` を reactivate | 成功（`changed:true`）。UNIQUE code 列に触れないため 409/throw は **発生しない**（C: spurious conflict path 不在を明示） |
| L-R5 | 二重 reactivate idempotency | `tag_inact_ref` を 2 回 reactivate | 1 回目 `changed:true` / 2 回目 `changed:false`。最終 `active===true` |

```ts
it("L-R1: inactive→active で changed:true + DB active=1", async () => {
  const r = await reactivateTagDefinition(env.ctx, "tag_inact_ref");
  expect(r).not.toBeNull();
  expect(r?.changed).toBe(true);
  expect(r?.row.active).toBe(true);
  const row = await env.db
    .prepare("SELECT active FROM tag_definitions WHERE tag_id='tag_inact_ref'")
    .first<{ active: number }>();
  expect(row?.active).toBe(1);
});

it("L-R2: 既 active は idempotent no-op（changed:false）", async () => {
  const r = await reactivateTagDefinition(env.ctx, "tag_active");
  expect(r?.changed).toBe(false);
  expect(r?.row.active).toBe(true);
});
```

### 3.3 `countMemberTagReferences` ケース

| ID | シナリオ | act | assert |
|----|----------|-----|--------|
| L-C1 | 参照0 | `countMemberTagReferences(env.ctx,"tag_inact_free")` | `0` |
| L-C2 | 参照1（N件）| `countMemberTagReferences(env.ctx,"tag_inact_ref")` | `1`。複数 member 付与を追加投入した場合は件数分（N件境界は Phase 6 で拡充） |
| L-C3 | 不在 tag の参照 | `countMemberTagReferences(env.ctx,"nope")` | `0`（行なし → COUNT 0） |

### 3.4 `physicalDeleteTagDefinition` ケース

| ID | シナリオ | arrange / act | assert（PhysicalDeleteTagDefinitionResult） |
|----|----------|---------------|----------------------------------|
| L-P1 | 参照0 → 削除成功 | `tag_inact_free`（参照0）を physicalDelete | `{ ok:true, row }`。`row` は削除前 snapshot（`code==="legacy_free"`）。`env.db` 直読で `tag_definitions` から `tag_inact_free` が **消えている**（COUNT 0） |
| L-P2 | 削除後 code 解放 → 同 code 再作成可 | L-P1 後 `createTagDefinition(env.ctx,{code:"legacy_free",label:"再作成",category:"misc"})` | `{ ok:true, row }`（UNIQUE 衝突せず再作成成功）。新 `tagId` は元と別 UUID |
| L-P3 | 参照あり → has_references 拒否 | `tag_inact_ref`（参照1）を physicalDelete | `{ ok:false, reason:"has_references", referenceCount:1 }`。**削除されず** DB に row 残存（COUNT 1）。member_tags も不変（COUNT 1） |
| L-P4 | 不在 → not_found | `physicalDeleteTagDefinition(env.ctx,"nope")` | `{ ok:false, reason:"not_found" }` |
| L-P5 | active な tag も参照0なら削除可 | `tag_active`（active=1, 参照0）を physicalDelete | `{ ok:true, row }`（physical は active 状態を問わない。参照のみがガード）。DB から消滅 |

```ts
it("L-P1: 参照0 → 削除成功 + row 返却 + DB から消滅", async () => {
  const r = await physicalDeleteTagDefinition(env.ctx, "tag_inact_free");
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.row.code).toBe("legacy_free");
  const n = await env.db
    .prepare("SELECT COUNT(*) AS n FROM tag_definitions WHERE tag_id='tag_inact_free'")
    .first<{ n: number }>();
  expect(n?.n).toBe(0);
});

it("L-P2: 削除後 code 解放 → 同 code 再作成可", async () => {
  await physicalDeleteTagDefinition(env.ctx, "tag_inact_free");
  const re = await createTagDefinition(env.ctx, {
    code: "legacy_free",
    label: "再作成",
    category: "misc",
  });
  expect(re.ok).toBe(true);
});

it("L-P3: 参照あり → has_references 拒否 + row 保持", async () => {
  const r = await physicalDeleteTagDefinition(env.ctx, "tag_inact_ref");
  expect(r).toEqual({ ok: false, reason: "has_references", referenceCount: 1 });
  const def = await env.db
    .prepare("SELECT COUNT(*) AS n FROM tag_definitions WHERE tag_id='tag_inact_ref'")
    .first<{ n: number }>();
  expect(def?.n).toBe(1); // 削除されていない
  const mt = await env.db
    .prepare("SELECT COUNT(*) AS n FROM member_tags WHERE tag_id='tag_inact_ref'")
    .first<{ n: number }>();
  expect(mt?.n).toBe(1); // member_tags も touch されない
});

it("L-P4: 不在 → not_found", async () => {
  const r = await physicalDeleteTagDefinition(env.ctx, "nope");
  expect(r).toEqual({ ok: false, reason: "not_found" });
});
```

---

## 4. `tags.lifecycle.contract.spec.ts`（route contract）

### 4.1 ヘッダ・import・helper

```ts
// @vitest-environment node
// issue-1070: tag lifecycle route の contract spec。
//   POST /admin/tags/:tagId/reactivate と DELETE /admin/tags/:tagId/physical の
//   status・audit・referenceCount・body を検証する。
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { createAdminTagsRoute } from "./tags";
import { adminAuthHeader, TEST_AUTH_SECRET } from "./_test-auth";

const makeEnv = (env: InMemoryD1) => ({
  DB: env.db as unknown as D1Database,
  SYNC_ADMIN_TOKEN: "t",
  AUTH_SECRET: TEST_AUTH_SECRET,
});

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

> seed は §2.1 と同一（active / inactive+参照 / inactive+参照なし）。route は `createAdminTagsRoute()` を `app.request(path, init, makeEnv(env))` で叩く。

### 4.2 `POST /tags/:tagId/reactivate` ケース

| ID | シナリオ | リクエスト | 期待 |
|----|----------|-----------|------|
| C-R1 | inactive→active 200 | POST `/tags/tag_inact_ref/reactivate` | `200`。body `rowBody`（`{tagId,code,label,category,active:true}`）。DB `active===1` |
| C-R2 | reactivate audit | C-R1 後 | `auditCount("admin.tag.reactivated","tag_inact_ref")===1`。`before={active:false}` / `after={active:true}`（JSON 詳細は Phase 6） |
| C-R3 | 既 active idempotent → 200 no-audit | POST `/tags/tag_active/reactivate` | `200`。body active:true。`auditCount("admin.tag.reactivated","tag_active")===0`（no-op で audit 増えない） |
| C-R4 | 不在 → 404 | POST `/tags/nope/reactivate` | `404`。`{ ok:false, error:"tag_not_found" }`。audit 0 件 |
| C-R5 | 二重 reactivate | `tag_inact_ref` を 2 回 reactivate | 両方 `200`。`auditCount("admin.tag.reactivated","tag_inact_ref")===1`（1 回目のみ） |

```ts
it("C-R1: POST reactivate → 200 + active:true + audit 1 件", async () => {
  const app = createAdminTagsRoute();
  const res = await app.request(
    "/tags/tag_inact_ref/reactivate",
    { method: "POST", headers: { ...(await adminAuthHeader()) } },
    makeEnv(env),
  );
  expect(res.status).toBe(200);
  const body = (await res.json()) as { active: boolean; code: string };
  expect(body.active).toBe(true);
  expect(await auditCount(env, "admin.tag.reactivated", "tag_inact_ref")).toBe(1);
});

it("C-R3: 既 active reactivate は 200 だが audit 増えない", async () => {
  const app = createAdminTagsRoute();
  const res = await app.request(
    "/tags/tag_active/reactivate",
    { method: "POST", headers: { ...(await adminAuthHeader()) } },
    makeEnv(env),
  );
  expect(res.status).toBe(200);
  expect(await auditCount(env, "admin.tag.reactivated", "tag_active")).toBe(0);
});
```

### 4.3 `DELETE /tags/:tagId/physical` ケース

| ID | シナリオ | リクエスト | 期待 |
|----|----------|-----------|------|
| C-P1 | 参照0 → 204 削除 | DELETE `/tags/tag_inact_free/physical` | `204`（body なし）。DB から `tag_inact_free` 消滅（COUNT 0） |
| C-P2 | physical audit | C-P1 後 | `auditCount("admin.tag.physically_deleted","tag_inact_free")===1`。`before`=full row(`{code,label,category,active}`) / `after`=null（JSON 詳細は Phase 6） |
| C-P3 | 参照あり → 409 + referenceCount | DELETE `/tags/tag_inact_ref/physical` | `409`。`{ ok:false, error:"tag_has_references", referenceCount:1 }`。DB row 残存・audit 0 件 |
| C-P4 | 不在 → 404 | DELETE `/tags/nope/physical` | `404`。`{ ok:false, error:"tag_not_found" }`。audit 0 件 |
| C-P5 | 削除後 同 code 再 POST 可 | C-P1 後 POST `/tags` body `{code:"legacy_free",label:"再",category:"misc"}` | `201`（code 解放済みで衝突しない） |

```ts
it("C-P1: 参照0 physical delete → 204 + DB 消滅 + audit 1 件", async () => {
  const app = createAdminTagsRoute();
  const res = await app.request(
    "/tags/tag_inact_free/physical",
    { method: "DELETE", headers: { ...(await adminAuthHeader()) } },
    makeEnv(env),
  );
  expect(res.status).toBe(204);
  const n = await env.db
    .prepare("SELECT COUNT(*) AS n FROM tag_definitions WHERE tag_id='tag_inact_free'")
    .first<{ n: number }>();
  expect(n?.n).toBe(0);
  expect(await auditCount(env, "admin.tag.physically_deleted", "tag_inact_free")).toBe(1);
});

it("C-P3: 参照あり physical delete → 409 + referenceCount", async () => {
  const app = createAdminTagsRoute();
  const res = await app.request(
    "/tags/tag_inact_ref/physical",
    { method: "DELETE", headers: { ...(await adminAuthHeader()) } },
    makeEnv(env),
  );
  expect(res.status).toBe(409);
  const body = (await res.json()) as { error: string; referenceCount: number };
  expect(body.error).toBe("tag_has_references");
  expect(body.referenceCount).toBe(1);
  expect(await auditCount(env, "admin.tag.physically_deleted", "tag_inact_ref")).toBe(0);
});
```

### 4.4 authz regression（新 route も requireAdmin 配下）

| ID | シナリオ | 期待 |
|----|----------|------|
| C-Z1 | reactivate 未認証 | POST `/tags/tag_inact_ref/reactivate` を Authorization 無し → `401`（`requireAdmin`） |
| C-Z2 | physical 未認証 | DELETE `/tags/tag_inact_free/physical` を Authorization 無し → `401` |

---

## 5. `tags.contract.spec.ts`（既存）への regression 追加（AC-6）

既存 logical DELETE が **不変**であることを固定する describe ブロックを追加する（physical / logical の分離を回帰で保証）。

| ID | シナリオ | リクエスト | 期待 |
|----|----------|-----------|------|
| C-L1 | logical DELETE 不変 | DELETE `/tags/tag_eng`（既存 seed の active tag） | `204`。DB `active===0`（**row は消えない**）。`member_tags` 保持 |
| C-L2 | logical と physical の経路分離 | logical DELETE 後の同 tag に `getTagDefinitionByIdRaw` 相当 GET | row は依然取得可能（active=0）。physical（消滅）と挙動が異なることを対比 |
| C-L3 | logical audit 不変 | C-L1 後 | `auditCount("admin.tag.deactivated","tag_eng")===1`（reactivated/physically_deleted は 0） |

> C-L1..C-L3 は既存 seed（`tag_eng` 等）を使う既存 describe の隣に追加する。新 action（reactivated/physically_deleted）が誤って logical 経路で発火しないことも合わせて確認する。

---

## 6. 成果物

| 成果物 | パス |
|--------|------|
| repository lifecycle spec | `apps/api/src/repository/__tests__/tagDefinitions.lifecycle.repository.spec.ts`（新規・D1 config 必須） |
| route lifecycle spec | `apps/api/src/routes/admin/tags.lifecycle.contract.spec.ts`（新規） |
| logical regression 追加 | `apps/api/src/routes/admin/tags.contract.spec.ts`（既存に describe 追加） |

## 7. RED 状態の確認

Phase 5 着手前、以下が **import / 関数未定義で fail** することを確認する（RED）:

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/tagDefinitions.lifecycle.repository.spec.ts \
  apps/api/src/routes/admin/tags.lifecycle.contract.spec.ts
```

- 初期 RED 時点では `reactivateTagDefinition` / `countMemberTagReferences` / `physicalDeleteTagDefinition`、および route の `/reactivate` / `/physical` handler が未実装のため module resolution / 404（route 未登録）で fail する想定。Phase 5（GREEN）で全件 PASS させる。

## 8. targeted run list（Phase 5/6 共通）

```
apps/api/src/repository/__tests__/tagDefinitions.lifecycle.repository.spec.ts
apps/api/src/routes/admin/tags.lifecycle.contract.spec.ts
apps/api/src/routes/admin/tags.contract.spec.ts             # AC-6 logical regression
```

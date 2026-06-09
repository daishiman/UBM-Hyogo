# Phase 4: テスト作成

## ステータス: completed

issue #1129「単一 tag write endpoint への batchId 相関キー付与」の TDD Red 計画。
単一 tag write（assign / unassign）の audit payload に `batchId`（リクエスト単位の correlation key）を
付与し、既存 `GET /admin/audit?batchId=` フィルタに乗ることを検証する。

---

## 前提・依存整合

- **Phase 4 開始前に `pnpm install` 済みであること**（必ず `mise exec -- pnpm install` で Node 24 / esbuild を整える）。
  ワークツリーごとに `node_modules` が独立するため、未実行だと vitest 実行時に esbuild version mismatch
  （`Host version "X" does not match binary version "Y"`）で fail する。トラブル時は
  `pnpm verify:vitest-runtime` で arch / worktree isolation / esbuild version を一括確認する。
- 実行 config: `vitest.d1.config.ts`。テストloader `apps/api/src/repository/__tests__/_setup.ts` が
  全 migration を適用し、各テスト前に TRUNCATE する。schema 変更・migration 追加は本 issue では無し。
- 相関単位 = **リクエスト単位（群サイズ 1）**。各単一 write が route 層で `crypto.randomUUID()` を 1 回生成する。
- 検証は **route contract のみ**。private method 単体テストは該当なし（route handler を `app.request` で叩く）。

---

## 拡充する既存テストファイル

| ファイル | 役割 |
|---------|------|
| `apps/api/src/routes/admin/members.tags.contract.spec.ts` | 単一 assign/unassign の audit payload に batchId が乗ること・noop 非退化 |
| `apps/api/src/routes/admin/audit.contract.spec.ts` | 単一 write 由来 batchId で `GET /admin/audit?batchId=` がヒットすること |

---

## 追加 / 更新する test ケース一覧（TDD Red）

### 1. `members.tags.contract.spec.ts`（単一 write payload に batchId）

audit payload の中身は既存 `auditCount` ヘルパ（件数のみ・52-60行）では検証できないため、
`after_json` / `before_json` を直接読む小ヘルパを **追加**する（既存ヘルパは非破壊で温存）。

```ts
// 追加ヘルパ（既存 auditCount の直後に置く）
const latestAuditPayload = async (
  env: InMemoryD1,
  action: string,
): Promise<{ before: unknown; after: unknown } | null> => {
  const r = await env.db
    .prepare(
      "SELECT before_json, after_json FROM audit_log WHERE target_type='member' AND target_id='m1' AND action=?1 ORDER BY created_at DESC, audit_id DESC LIMIT 1",
    )
    .bind(action)
    .first<{ before_json: string | null; after_json: string | null }>();
  if (!r) return null;
  return {
    before: r.before_json ? JSON.parse(r.before_json) : null,
    after: r.after_json ? JSON.parse(r.after_json) : null,
  };
};

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
```

| テストID | 対象 | 期待値 |
|----------|------|--------|
| A-T1b | `POST /members/m1/tags`（新規 assign が真） | `after` が `{ tagId: "tag_eng", source: "manual", batchId: <string> }` を満たす。`batchId` は `expect.any(String)` かつ `UUID_V4` にマッチ。`before` は `null`。 |
| A-T7b | `DELETE /members/m1/tags/tag_eng`（既存付与の unassign が真） | `before` が `{ tagId: "tag_eng", batchId: <string> }` を満たす。`batchId` は `UUID_V4` にマッチ。`after` は `null`。 |
| A-T2b | 同一 tag を 2 回 POST（2 回目は noop） | audit 件数が 1 のまま増えない（`auditCount === 1`）＝ noop 時に append を呼ばず batchId も生成しない。 |
| A-T8b | 未存在付与の DELETE（noop） | audit 件数 0 のまま（`auditCount === 0`）＝ noop 非退化。 |

ケース実装方針（assign 例）:

```ts
it("A-T1b: POST assign 成功時 audit after_json に batchId(UUID v4) が含まれる", async () => {
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
  const payload = await latestAuditPayload(env, "admin.member.tag_assigned");
  expect(payload?.before).toBeNull();
  expect(payload?.after).toEqual(
    expect.objectContaining({
      tagId: "tag_eng",
      source: "manual",
      batchId: expect.any(String),
    }),
  );
  expect((payload?.after as { batchId: string }).batchId).toMatch(UUID_V4);
});
```

unassign 例:

```ts
it("A-T7b: DELETE unassign 成功時 audit before_json に batchId(UUID v4) が含まれる", async () => {
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
  const payload = await latestAuditPayload(env, "admin.member.tag_unassigned");
  expect(payload?.after).toBeNull();
  expect(payload?.before).toEqual(
    expect.objectContaining({ tagId: "tag_eng", batchId: expect.any(String) }),
  );
  expect((payload?.before as { batchId: string }).batchId).toMatch(UUID_V4);
});
```

### 2. `audit.contract.spec.ts`（単一 write 由来 batchId のフィルタ）

既存 seed（13-123行）は固定 batchId `batch-1079`（bulk 由来）を前提とする。単一 write は実際の route を
叩いて生成される動的 UUID を使うため、新ケースでは route handler 経由で audit 行を作り、生成された
`batchId` を payload から逆引きしてフィルタする方式を取る。`createAdminMembersRoute` と
`createAdminAuditRoute` を同一 `env` 上で組み合わせる。

| テストID | 対象 | 期待値 |
|----------|------|--------|
| AU-1129-1 | 単一 assign 実行 → 生成された batchId で `GET /admin/audit?batchId=<uuid>` | items に当該 assign 行（action=`admin.member.tag_assigned`）が 1 件ヒット。`appliedFilters.batchId` が当該 uuid。 |
| AU-1129-2 | 単一 assign→unassign を別々に実行 → unassign の batchId でフィルタ | unassign 行（before_json 由来・action=`admin.member.tag_unassigned`）がヒット。assign 由来 batchId とは別 uuid であること（`assignBatchId !== unassignBatchId`）。 |

実装方針: route を直接叩いた後、`audit_log` テーブルから `after_json` / `before_json` を読んで
生成済み batchId を取得し、その値を `?batchId=` に渡す（テストファイル内で route 結果を真実とする）。
seed の member（`m1` / `tag_eng`）は audit.contract 側で必要な member_identities / member_status /
tag_definitions を `members.tags.contract.spec.ts` の `seedMembers` 相当で投入する（同等 SQL を inline）。

---

## 既存 assertion 影響分析（壊れる箇所と更新方針）

| 箇所 | 影響 | 方針 |
|------|------|------|
| `members.tags.contract.spec.ts` A-T1 / A-T2 / A-T7 / A-T8 の `auditCount(...)` 系（83/103/202/221行） | **影響なし**。`auditCount` は `COUNT(*)` のみで payload を見ない。batchId 追加で件数は変わらない。 | 変更不要。 |
| `members.tags.contract.spec.ts` の他 assertion（assigned/available shape・404・409・400） | **影響なし**。payload に触れない。 | 変更不要。 |
| `audit.contract.spec.ts` の `batch-1079` 系テスト（233-309行） | **影響なし**。固定 seed `batch-1079`（bulk 由来）に対するもので、単一 write の動的 UUID とは別物。`maskedAfter` / `maskedBefore` の projection は batchId を平文露出する（PII 非該当キー）が、既存テストは `toContain("batch-1079")` を期待しており壊れない。 | 変更不要。新規ケースを追加するのみ。 |
| `audit.contract.spec.ts` の masked projection テスト（138-179行） | **影響なし**。`batchId` は mask 対象キー（responseEmail/phone/fullName 等）に含まれないため projection は素通り。 | 変更不要。 |

**結論**: 既存の `toEqual` / `toMatchObject` は audit payload の生 JSON ではなく派生 projection
（auditId / action / targetType 等）に対してのみ固定しているため、`objectContaining` への置換は不要。
新規 payload assertion はすべて `expect.objectContaining` を用い、将来の payload キー追加に耐える形にする。

---

## 期待される Red の出方

実装前（Phase 5 未適用）の状態で:

- A-T1b: `after.batchId` が undefined → `expect.objectContaining({ batchId: expect.any(String) })` で fail。
- A-T7b: `before.batchId` が undefined → fail。
- AU-1129-1 / AU-1129-2: payload に batchId が無く `?batchId=<undefined>` を組めない／ヒット 0 件で fail。
- A-T2b / A-T8b: 既存挙動どおり PASS（noop 非退化は実装前から成立。回帰 guard として Green を維持）。

---

## 完了条件

- [x] `members.tags.contract.spec.ts` に `latestAuditPayload` ヘルパと `UUID_V4` 正規表現を追加した。
- [x] A-T1b（assign after_json に batchId / UUID v4）を追加し、実装前に Red になることを確認した。
- [x] A-T7b（unassign before_json に batchId / UUID v4）を追加し、実装前に Red になることを確認した。
- [x] A-T2b / A-T8b（noop 非退化）を追加し、実装前後で Green を維持することを確認した。
- [x] `audit.contract.spec.ts` に AU-1129-1 / AU-1129-2 を追加し、実装前に Red になることを確認した。
- [x] 既存 assertion（auditCount 系・batch-1079 系・masked projection）が一切壊れないことを確認した（影響分析どおり変更不要）。
- [x] テストファイル名が `*.contract.spec.ts`（`.test.` 禁止）であることを確認した。
- [x] Phase 4 着手前に `mise exec -- pnpm install` 済みで esbuild mismatch が出ないことを確認した。

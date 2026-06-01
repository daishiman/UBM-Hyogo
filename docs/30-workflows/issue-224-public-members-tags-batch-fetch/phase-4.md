# Phase 4: テスト作成（TDD Red フェーズ）

> **Phase 種別**: テスト作成（実装前のテスト定義）
> **対象 issue**: #224 公開 members list の tags 一括取得 N+1 防止
> **前提**: Phase 1-3 完了（要件・設計・設計レビュー PASS）
> **次フェーズ**: Phase 5（実装）でこれらのテストを green にする

---

## 4.1 このフェーズのゴール

`/public/members?expand=tags` で各メンバーに表示用 tags（code/label/category）を返す機能を実装する前に、
期待する振る舞いをテストとして先に定義する（TDD の Red フェーズ）。

このフェーズで追加するテストは**実装前なので必ず失敗する（Red）**。Phase 5 の実装で green 化する。
特に本 issue の核心である「tags 取得を `member_id IN (...)` の 1 batch query に集約し、
件数に依存しない（N+1 を発生させない）」という不変条件を、テストで機械的に検知できる形に落とす。

---

## 4.2 実コードの事実（テスト基盤・取り違え防止）

実コードを読んだ結果、テスト基盤について以下を正とする（SubAgent 初回調査の誤りに注意）。

### use-case の呼び出し規約

- `listPublicMembersUseCase(query, { ctx })` で、`ctx` は **`{ db }` を包んだオブジェクト**。
  既存 spec は `await listPublicMembersUseCase(baseQuery, { ctx: { db: db as never } })` の形で呼ぶ。
- `db` は `createPublicD1Mock(options)` 由来。

### D1 mock（`createPublicD1Mock`）の fixture は **DB row 中心**（member fixture ではない）

`PublicD1MockOptions` の主なキー（本 issue で使うもの）:

| key | 用途 |
|-----|------|
| `publicMembers: unknown[]` | members list query（`SELECT mi.member_id, mi.current_response_id`）の結果。`buildPublicMemberRow({ member_id, current_response_id })` で作る |
| `publicMemberCount: number` | count query 結果 |
| `responseFieldsByResponseId: Record<string, unknown[]>` | fields（`current_response_id` キー）。`buildResponseFieldRow({ stable_key, value_json })` |
| `topTags: {code,label,count}[]` | tag aggregation（`GROUP BY td.code`）結果 |
| `tagsByMemberId: Record<string, unknown[]>` | **既存は単一 id query（`mt.member_id = ?1`）専用**。batch（`member_id IN`）分岐は現状 **未対応**（Phase 5 で追加） |
| `queryLog: string[]` | `db.prepare(sql)` の SQL を全件記録する。**SQL fragment で発行回数を数えられる**（既存 spec が利用） |
| `failOnSql: RegExp \| string` | 指定 SQL で throw |

> **重要**: `members[].tags` のような fixture は **存在しない**。tags は別 query（`member_tags ... member_id IN`）で取得され、
> その結果は Phase 5 で mock 拡張するか、use-case unit では `listTagsByMemberIds` を spy して注入する。

### 引き当てキー（混同禁止）

- **tags = `member_id`**（`listTagsByMemberIds` の返却行 `r.member_id`）
- **fields = `current_response_id`**（`listFieldsByResponseId`）

---

## 4.3 tags batch query 計数手段の確定（最重要）

AC-2 / AC-3 / AC-5 は「tags 取得クエリが件数に依存せず 1 回（expand 未指定時 0 回）」を要求する。検知手段を 2 段で確定する。

### 第一証跡: use-case unit test の `listTagsByMemberIds` spy

> **N+1 リグレッション検知の第一証跡は、`vi.spyOn(memberTagsModule, "listTagsByMemberIds")` の呼び出し回数とする。**
> - `expand=tags`: **件数によらず 1 回**だけ呼ばれ、第 2 引数は全 member_id を含む 1 配列。
> - `expand` 未指定: **0 回**（呼ばれない）。
>
> use-case は `import { listTagsByMemberIds } from "../../repository/memberTags"` で名前付き import するため、
> spec 側は `import * as memberTagsModule from "../../../repository/memberTags"` の namespace に `vi.spyOn` する
> （Vitest ESM は同一 module instance を共有するため、名前付き import 先も差し替わる。Phase 5 後に green 確認）。
> spy は `mockResolvedValue(flatRows)` でフラットな `MemberTagWithDefinition[]` を返し、groupBy 後の引き当ても検証する。

### 第二証跡: `queryLog` の SQL fragment 計数（補助・spy しない経路）

mock の `queryLog` に発行 SQL が全件積まれる。spy を使わない場合は次で計数できる。

```typescript
const tagBatchCalls = queryLog.filter(
  (sql) => sql.includes("FROM member_tags mt") && sql.includes("member_id IN"),
);
expect(tagBatchCalls).toHaveLength(1); // expand=tags
// expand 未指定なら expect(tagBatchCalls).toHaveLength(0);
```

> ただし `queryLog` は SQL を発行して初めて積まれるため、contract test で tags を実体表示させるには
> Phase 5 で mock に `member_id IN` 分岐を追加する必要がある（4.6.2 / Phase 5 §5.3.6 参照）。
> **本 Phase の第一証跡は spy（unit）を主とし、queryLog は二重チェックとして併記する。**

---

## 4.4 変更対象ファイル一覧と種別（CONST_005）

| ファイル | 種別 | 本 Phase での扱い |
|---------|------|-------------------|
| `apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts` | 編集 | tags expand / groupBy / N+1 spy のテスト追加（主対象） |
| `apps/api/src/routes/public/index.contract.spec.ts` | 編集 | `expand=tags` 出力契約 / appliedQuery 6 キー回帰追加（主対象） |
| `apps/api/src/_shared/search-query-parser.ts` | 編集（Phase 5） | `expand` 追加（Phase 4 時点では Red、現サイクルで Green 化済み） |
| `packages/shared/src/zod/viewmodel.ts` | 編集（Phase 5） | `PublicMemberTagZ` + `tags` optional |
| `packages/shared/src/types/viewmodel/index.ts` | 編集（Phase 5） | `PublicMemberListItem.tags?` |
| `apps/api/src/view-models/public/public-member-list-view.ts` | 編集（Phase 5） | source に `tags?` |
| `apps/api/src/use-cases/public/list-public-members.ts` | 編集（Phase 5） | expand 判定 + batch + groupBy |
| `apps/api/src/use-cases/public/__tests__/helpers/public-d1.ts` | 編集（Phase 5） | `member_id IN` 分岐 + `tagsByMemberId` 再利用で batch 対応 |
| `apps/api/src/repository/memberTags.ts` | 無改変 | `listTagsByMemberIds` を spy 対象として利用 |

> 本 Phase で**新規に書くテストコードは上 2 つの spec のみ**。残りは Phase 5。

---

## 4.5 テストケース一覧

| TC | 対象 spec | 内容 | 期待結果 |
|----|-----------|------|---------|
| TC-1 | use-case | `expand=["tags"]` で各 member の `tags` が code/label/category 配列で付く | `items[i].tags` が期待配列に一致 |
| TC-2 | use-case | 複数 member × 複数 tag で member_id 別に正しく groupBy（取り違えなし） | m-1 と m-2 の tags が混ざらない |
| TC-3 | use-case | tags batch query が件数によらず **1 回**・全 id を 1 配列で渡す | spy 1 回 / 第2引数=全 member_id |
| TC-4 | use-case | `expand` 未指定で item に `tags` キー無し かつ batch query **0 回** | `items[i].tags` undefined / spy 未呼出 |
| TC-5 | use-case | 空 member 集合では helper を呼ばない（mids=[]） | spy 0 回 / items 0 件 |
| TC-6 | contract | `expand=tags` で公開 member のみ tags を持ち leak しない | filter 通過 member のみ tags |
| TC-7 | contract | `appliedQuery` が 6 キー固定のまま（expand を出さない） | key 集合 = `{q,zone,status,tags,sort,density}` |

### AC マッピング

| AC | 検証 TC |
|----|---------|
| AC-1 expand=tags で tags(code/label/category) 返却 | TC-1, TC-2, TC-6 |
| AC-2 `member_id IN` の 1 batch query のみ（件数非依存） | TC-3 |
| AC-3 expand 未指定で tags 含まない（batch query 0 回） | TC-4 |
| AC-4 visibility filter 維持（leak なし） | TC-6 |
| AC-5 contract・use-case test で N+1 リグレッション検知 | TC-3, TC-4 + TC-7（契約回帰） |

---

## 4.6 テストコード（追加分）

### 4.6.1 use-case unit spec（`list-public-members.spec.ts` に追記）

既存 import（`buildPublicMemberRow` / `buildResponseFieldRow` / `createPublicD1Mock` / `DEFAULT_PUBLIC_MEMBER_QUERY`）に加えて、
spy 用に以下を追加する。

```typescript
import { afterEach, vi } from "vitest"; // 既存の describe/expect/it に追加
import * as memberTagsModule from "../../../repository/memberTags";
import type { MemberTagWithDefinition } from "../../../repository/memberTags";
```

ヘルパとケースを追記する（既存 `describe("listPublicMembersUseCase", ...)` 内）。

```typescript
afterEach(() => {
  vi.restoreAllMocks();
});

// listTagsByMemberIds が返すフラット行（必要 field のみ・残りはダミー）
const flatTag = (
  member_id: string,
  code: string,
  label: string,
  category: string,
): MemberTagWithDefinition => ({
  member_id,
  tag_id: `tag-${code}`,
  source: "forms",
  confidence: null,
  assigned_at: "2024-01-01T00:00:00Z",
  assigned_by: null,
  code,
  label,
  category,
  source_stable_keys_json: "[]",
  active: 1,
});

const withExpandTags = {
  ...DEFAULT_PUBLIC_MEMBER_QUERY,
  expand: ["tags"] as ("tags")[],
};

// TC-1: expand=tags で各 member に tags 配列が付く
it("attaches tags to each member when expand includes 'tags'", async () => {
  vi.spyOn(memberTagsModule, "listTagsByMemberIds").mockResolvedValue([
    flatTag("m-1", "founder", "創業メンバー", "role"),
    flatTag("m-1", "tech", "技術", "skill"),
  ]);
  const db = createPublicD1Mock({
    publicMembers: [buildPublicMemberRow({ member_id: "m-1", current_response_id: "r-1" })],
    publicMemberCount: 1,
    responseFieldsByResponseId: {
      "r-1": [buildResponseFieldRow({ stable_key: "fullName", value_json: JSON.stringify("テスト 太郎") })],
    },
  });

  const result = await listPublicMembersUseCase(withExpandTags, { ctx: { db: db as never } });

  expect(result.items[0]?.tags).toEqual([
    { code: "founder", label: "創業メンバー", category: "role" },
    { code: "tech", label: "技術", category: "skill" },
  ]);
});

// TC-2: 複数 member × 複数 tag で member_id 別に正しく groupBy
it("groups tags by member_id without cross-contamination", async () => {
  vi.spyOn(memberTagsModule, "listTagsByMemberIds").mockResolvedValue([
    flatTag("m-1", "t1", "L1", "c1"),
    flatTag("m-2", "t2", "L2", "c2"),
    flatTag("m-2", "t3", "L3", "c3"),
  ]);
  const db = createPublicD1Mock({
    publicMembers: [
      buildPublicMemberRow({ member_id: "m-1", current_response_id: "r-1" }),
      buildPublicMemberRow({ member_id: "m-2", current_response_id: "r-2" }),
    ],
    publicMemberCount: 2,
    responseFieldsByResponseId: { "r-1": [], "r-2": [] },
  });

  const result = await listPublicMembersUseCase(withExpandTags, { ctx: { db: db as never } });

  const m1 = result.items.find((i) => i.memberId === "m-1");
  const m2 = result.items.find((i) => i.memberId === "m-2");
  expect(m1?.tags).toEqual([{ code: "t1", label: "L1", category: "c1" }]);
  expect(m2?.tags).toEqual([
    { code: "t2", label: "L2", category: "c2" },
    { code: "t3", label: "L3", category: "c3" },
  ]);
});

// TC-3: tags batch query が件数によらず 1 回（N+1 検知の第一証跡）
it("calls listTagsByMemberIds exactly once with all member ids (no N+1)", async () => {
  const spy = vi
    .spyOn(memberTagsModule, "listTagsByMemberIds")
    .mockResolvedValue([flatTag("m-1", "t1", "L1", "c1"), flatTag("m-3", "t3", "L3", "c3")]);
  const db = createPublicD1Mock({
    publicMembers: [
      buildPublicMemberRow({ member_id: "m-1", current_response_id: "r-1" }),
      buildPublicMemberRow({ member_id: "m-2", current_response_id: "r-2" }),
      buildPublicMemberRow({ member_id: "m-3", current_response_id: "r-3" }),
    ],
    publicMemberCount: 3,
    responseFieldsByResponseId: { "r-1": [], "r-2": [], "r-3": [] },
  });

  await listPublicMembersUseCase(withExpandTags, { ctx: { db: db as never } });

  expect(spy).toHaveBeenCalledTimes(1);
  const passedIds = spy.mock.calls[0]?.[1] as string[]; // 第2引数 = member_id 配列
  expect(passedIds).toEqual(["m-1", "m-2", "m-3"]);
});

// TC-4: expand 未指定で tags キー無し かつ batch query 0 回
it("does not fetch tags when expand is omitted", async () => {
  const spy = vi.spyOn(memberTagsModule, "listTagsByMemberIds");
  const db = createPublicD1Mock({
    publicMembers: [buildPublicMemberRow({ member_id: "m-1", current_response_id: "r-1" })],
    publicMemberCount: 1,
    responseFieldsByResponseId: { "r-1": [] },
  });

  const result = await listPublicMembersUseCase(
    { ...DEFAULT_PUBLIC_MEMBER_QUERY }, // expand 未指定 → []
    { ctx: { db: db as never } },
  );

  expect(spy).not.toHaveBeenCalled();
  expect(result.items[0]?.tags).toBeUndefined();
});

// TC-5: 空 member 集合では helper を呼ばない
it("does not call listTagsByMemberIds when there are no members", async () => {
  const spy = vi.spyOn(memberTagsModule, "listTagsByMemberIds");
  const db = createPublicD1Mock({ publicMembers: [], publicMemberCount: 0 });

  const result = await listPublicMembersUseCase(withExpandTags, { ctx: { db: db as never } });

  expect(spy).not.toHaveBeenCalled();
  expect(result.items).toHaveLength(0);
});
```

> **spy 引数の型注意**: `listTagsByMemberIds(c, mids: MemberId[])` の `mids` は branded type。
> `spy.mock.calls[0]?.[1]` は実行時 string 配列なので `as string[]` で取り出して比較する。第 1 引数（ctx）は assert しない。

### 4.6.2 contract spec（`index.contract.spec.ts` に追記）

contract は `app.request(path, {}, env)` 形式で、`env = buildEnv({ DB: createPublicD1Mock({...}) })`。
**mock の batch 分岐は現状未対応**のため、TC-6 を実体 tags で green にするには Phase 5 §5.3.6 の mock 拡張が前提
（本 Phase では Red）。新規ケースを `describe("createPublicRouter", ...)` 内に追記する。

```typescript
// TC-6: expand=tags で公開 member のみ tags を持ち、leak しない
it("GET /members?expand=tags は公開 member の tags(code/label/category) を返す", async () => {
  const app = new Hono();
  app.onError(errorHandler);
  app.route("/public", createPublicRouter());
  const env = buildEnv({
    DB: createPublicD1Mock({
      publicMembers: [buildPublicMemberRow({ member_id: "m-1", current_response_id: "r-1" })],
      publicMemberCount: 1,
      responseFieldsByResponseId: {
        "r-1": [buildResponseFieldRow({ stable_key: "fullName", value_json: JSON.stringify("田中 太郎") })],
      },
      // Phase 5 で batch 分岐が参照する fixture（member_id キー）。
      tagsByMemberId: {
        "m-1": [
          {
            member_id: "m-1",
            tag_id: "tag-web",
            source: "forms",
            confidence: null,
            assigned_at: "2024-01-01T00:00:00Z",
            assigned_by: null,
            code: "web",
            label: "Web",
            category: "skill",
            source_stable_keys_json: "[]",
            active: 1,
          },
        ],
        // m-9 は publicMembers に含めない＝visibility filter 外。batch には渡らず leak しない。
        "m-9": [
          {
            member_id: "m-9",
            tag_id: "tag-secret",
            code: "secret",
            label: "秘",
            category: "hidden",
            source: "forms",
            confidence: null,
            assigned_at: "2024-01-01T00:00:00Z",
            assigned_by: null,
            source_stable_keys_json: "[]",
            active: 1,
          },
        ],
      },
    }),
  });
  const res = await app.request("/public/members?expand=tags", {}, env);
  expect(res.status).toBe(200);
  const body = (await res.json()) as {
    items: Array<{ memberId: string; tags?: Array<{ code: string }> }>;
  };
  expect(body.items).toHaveLength(1);
  expect(body.items[0]?.tags).toEqual([{ code: "web", label: "Web", category: "skill" }]);
  expect(JSON.stringify(body.items).includes("secret")).toBe(false); // leak しない
});

// TC-7: appliedQuery は 6 キー固定（expand を含めない）
it("GET /members?expand=tags でも appliedQuery は 6 キー固定（expand を出さない）", async () => {
  const app = new Hono();
  app.onError(errorHandler);
  app.route("/public", createPublicRouter());
  const env = buildEnv({
    DB: createPublicD1Mock({
      publicMembers: [buildPublicMemberRow({ member_id: "m-1", current_response_id: "r-1" })],
      publicMemberCount: 1,
      responseFieldsByResponseId: { "r-1": [buildResponseFieldRow()] },
      tagsByMemberId: { "m-1": [] },
    }),
  });
  const res = await app.request("/public/members?expand=tags&q=test", {}, env);
  expect(res.status).toBe(200);
  const body = (await res.json()) as { appliedQuery: Record<string, unknown> };
  expect(Object.keys(body.appliedQuery).sort()).toEqual(
    ["density", "q", "sort", "status", "tags", "zone"].sort(),
  );
  expect(body.appliedQuery).not.toHaveProperty("expand");
});
```

> `buildEnv` / `createPublicRouter` / `errorHandler` / `buildPublicMemberRow` / `buildResponseFieldRow` /
> `createPublicD1Mock` は既存 import 済（contract spec 冒頭参照）。新規 import 不要。

---

## 4.7 入出力・副作用

- **入力**: `ParsedPublicMemberQuery`（`expand` 含む/含まない）、`createPublicD1Mock` 由来の `db`。
- **出力**: `PublicMemberListResponse`（`items[].tags?` の有無、`appliedQuery` 6 キー）。
- **副作用**: `vi.spyOn(memberTagsModule, "listTagsByMemberIds")` の module spy。`afterEach(vi.restoreAllMocks)` で復元。DB 実書き込み無し。

---

## 4.8 ローカル実行コマンド（CONST_005）

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test --run src/use-cases/public/__tests__/list-public-members.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api test --run src/routes/public/index.contract.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api test --run
mise exec -- pnpm typecheck
```

---

## 4.9 期待される結果（Red）

- `ParsedPublicMemberQuery` に `expand` が無いため `{ ...DEFAULT_PUBLIC_MEMBER_QUERY, expand: ["tags"] }` が **型エラー**。
- use-case がまだ `listTagsByMemberIds` を呼ばないため TC-1/TC-2/TC-3 が「tags 不在」「spy 0 回」で **失敗**。
- `PublicMemberListItemZ` に `tags` が無く view-model が素通ししないため `items[].tags` は常に undefined → TC-1/TC-6 **失敗**。
- D1 mock に batch 分岐が無いため contract TC-6 も **失敗**（Phase 5 で mock 拡張）。
- TC-4/TC-5/TC-7 は実装次第で偶然 green になり得るが、TC-1〜TC-3 が確実に Red なら Red フェーズ成立。

---

## 4.10 DoD（Definition of Done）

- [ ] use-case spec に TC-1〜TC-5 を追記（`flatTag` ヘルパ + `withExpandTags` + `afterEach(vi.restoreAllMocks)` 含む）
- [ ] contract spec に TC-6, TC-7 を追記（`buildEnv({ DB })` 形式・`createPublicRouter` 組み立てを踏襲）
- [ ] 計数の第一証跡が `listTagsByMemberIds` の `vi.spyOn`、第二証跡が `queryLog` の `member_id IN` fragment 計数であることを明示
- [ ] use-case 呼び出しが `{ ctx: { db: db as never } }`、mock fixture が `publicMembers` / `responseFieldsByResponseId` / `tagsByMemberId` であることを反映
- [ ] テストファイル名が全て `*.spec.ts`（不変条件 #8）
- [ ] 上記コマンドで TC-1〜TC-3 が Red になることを確認
- [ ] AC-1〜AC-5 を網羅
- [ ] `git status apps/ packages/` を確認（本仕様書作成タスクでは実コードを書かない＝クリーン）

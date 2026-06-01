# Phase 6: テスト拡充（fail path / 回帰 guard）

> **Phase 種別**: テスト拡充（境界値・異常系・回帰防止）
> **対象 issue**: #224 公開 members list の tags 一括取得 N+1 防止
> **前提**: Phase 5 実装完了・Phase 4 の TC-1〜TC-7 が green
> **次フェーズ**: Phase 7（カバレッジ確認）

---

## 6.1 このフェーズのゴール

Phase 4 の主要ケースに加え、`expand` パラメータの **正規化（whitelist / dedup / 空値）** と
**大量件数でも tags batch query が 1 回に保たれる**ことを回帰 guard として固める。
parser の異常系（whitelist 外混在・空文字・重複）を網羅し、N+1 防止が件数スケールで崩れないことを保証する。

---

## 6.2 変更対象ファイル一覧と種別（CONST_005）

| ファイル | 種別 | 説明 |
|---------|------|------|
| `apps/api/src/_shared/search-query-parser.spec.ts` | 新規 / 編集 | `expand` 正規化の unit test（既存有無を確認） |
| `apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts` | 編集 | 大量件数 N+1 回帰 guard 追加 |
| `apps/api/src/routes/public/index.contract.spec.ts` | 編集 | expand 正規化の出力契約（補助） |

> `search-query-parser` 専用 spec が既存かを先に確認する。
> ```bash
> ls apps/api/src/_shared/search-query-parser.spec.ts 2>/dev/null \
>   || echo "新規作成（*.spec.ts のみ。*.test.ts は不変条件 #8 で禁止）"
> ```
> 既存 spec があればその `describe` に追記、無ければ新規作成。ファイル名は必ず `*.spec.ts`
> （lefthook `block-test-suffix` / CI `verify-test-suffix` が `*.test.ts` を reject）。

---

## 6.3 テストケース一覧（拡充分）

| TC | 対象 | 内容 | 期待結果 |
|----|------|------|---------|
| TC-8 | parser | `expand="tags,unknown"`（whitelist 外混在）で `tags` のみ有効 | `expand` === `["tags"]` |
| TC-9 | parser | `expand=""`（空文字）で `expand` 空配列 | `expand` === `[]` |
| TC-10 | parser | `expand=["tags","tags"]`（繰り返し）で dedup | `expand` === `["tags"]` |
| TC-11 | parser | `expand="foo"`（whitelist 外単体）で空配列、かつ全体は default に落ちない | `expand`=`[]` / `q` 等は通常解析 |
| TC-12 | use-case | 大量件数（100 member）でも tags batch query 1 回 | spy 1 回 / 第2引数長 === 100 |
| TC-13 | use-case | 大量件数で member_id 別 groupBy が崩れない（先頭・末尾サンプル） | 各 item の tags が自 member 分のみ |
| TC-14 | contract | `expand="tags,unknown"` でも tags が返り、appliedQuery 6 キー固定 | items に tags / appliedQuery に expand 無し |

---

## 6.4 テストコード（追加分）

### 6.4.1 parser unit spec（`search-query-parser.spec.ts`）

`parsePublicMemberQuery(raw: Record<string, string | string[] | undefined>)` を直接呼ぶ。

```typescript
import { describe, expect, it } from "vitest";
import { parsePublicMemberQuery } from "./search-query-parser";

describe("parsePublicMemberQuery / expand", () => {
  // TC-8: whitelist 外混在 → tags のみ
  it("keeps only whitelisted 'tags' when mixed with unknown", () => {
    const q = parsePublicMemberQuery({ expand: "tags,unknown" });
    expect(q.expand).toEqual(["tags"]);
  });

  // TC-9: 空文字 → 空配列
  it("returns empty expand for empty string", () => {
    const q = parsePublicMemberQuery({ expand: "" });
    expect(q.expand).toEqual([]);
  });

  // TC-10: 繰り返し → dedup
  it("dedupes repeated expand=tags", () => {
    const q = parsePublicMemberQuery({ expand: ["tags", "tags"] });
    expect(q.expand).toEqual(["tags"]);
  });

  // TC-11: whitelist 外単体 → 空配列、他フィールドは正常（全体 default に落ちない）
  it("ignores unknown expand value without falling back to defaults", () => {
    const q = parsePublicMemberQuery({ expand: "foo", q: "alice" });
    expect(q.expand).toEqual([]);
    expect(q.q).toBe("alice");
  });

  // expand 未指定 → 空配列（後方互換）
  it("defaults expand to empty array when omitted", () => {
    const q = parsePublicMemberQuery({});
    expect(q.expand).toEqual([]);
  });
});
```

### 6.4.2 use-case 大量件数 N+1 回帰 guard（`list-public-members.spec.ts` に追記）

Phase 4 で定義した `flatTag` ヘルパと `memberTagsModule` spy / `afterEach(vi.restoreAllMocks)` を再利用する。
mock fixture は実 API（`publicMembers` / `publicMemberCount` / `responseFieldsByResponseId`）に揃える。

```typescript
// TC-12 / TC-13: 大量件数でも tags batch query は 1 回、groupBy 不変
it("fetches tags in a single batch query for large member sets (limit=100)", async () => {
  const N = 100;
  const publicMembers = Array.from({ length: N }, (_, i) =>
    buildPublicMemberRow({ member_id: `m-${i}`, current_response_id: `r-${i}` }),
  );
  const responseFieldsByResponseId = Object.fromEntries(
    Array.from({ length: N }, (_, i) => [`r-${i}`, []]),
  );
  const tagRows = Array.from({ length: N }, (_, i) => flatTag(`m-${i}`, `c${i}`, `L${i}`, "cat"));

  const spy = vi
    .spyOn(memberTagsModule, "listTagsByMemberIds")
    .mockResolvedValue(tagRows);
  const db = createPublicD1Mock({
    publicMembers,
    publicMemberCount: N,
    responseFieldsByResponseId,
  });

  const result = await listPublicMembersUseCase(
    { ...DEFAULT_PUBLIC_MEMBER_QUERY, limit: 100, expand: ["tags"] as ("tags")[] },
    { ctx: { db: db as never } },
  );

  // N+1 回帰 guard: 件数によらず 1 回・全 id を 1 配列で渡す
  expect(spy).toHaveBeenCalledTimes(1);
  expect((spy.mock.calls[0]?.[1] as string[]).length).toBe(N);

  // groupBy が崩れていない（先頭・末尾サンプル）
  const first = result.items.find((i) => i.memberId === "m-0");
  const last = result.items.find((i) => i.memberId === `m-${N - 1}`);
  expect(first?.tags).toEqual([{ code: "c0", label: "L0", category: "cat" }]);
  expect(last?.tags).toEqual([
    { code: `c${N - 1}`, label: `L${N - 1}`, category: "cat" },
  ]);
});
```

### 6.4.3 contract spec（`index.contract.spec.ts` に追記）

`buildEnv({ DB })` + `createPublicRouter` 組み立て（Phase 4 §4.6.2 と同形）。Phase 5 の mock batch 分岐が前提。

```typescript
// TC-14: whitelist 外混在でも tags 返却 + appliedQuery 6 キー
it("GET /members?expand=tags,unknown でも tags を返し appliedQuery は 6 キー固定", async () => {
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
      tagsByMemberId: {
        "m-1": [
          {
            member_id: "m-1",
            tag_id: "tag-web",
            code: "web",
            label: "Web",
            category: "skill",
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
  const res = await app.request("/public/members?expand=tags,unknown", {}, env);
  expect(res.status).toBe(200);
  const body = (await res.json()) as {
    items: Array<{ tags?: Array<{ code: string }> }>;
    appliedQuery: Record<string, unknown>;
  };
  expect(body.items[0]?.tags).toEqual([{ code: "web", label: "Web", category: "skill" }]);
  expect(Object.keys(body.appliedQuery).sort()).toEqual(
    ["density", "q", "sort", "status", "tags", "zone"].sort(),
  );
});
```

---

## 6.5 入出力・副作用

- **入力**: parser へは生クエリ `Record<string, string | string[] | undefined>`、use-case へは正規化済 `ParsedPublicMemberQuery`。
- **出力**: parser は `expand: ("tags")[]`、use-case/contract は tags 付き / 6 キー appliedQuery。
- **副作用**: `vi.spyOn` による module spy（`afterEach(vi.restoreAllMocks)` で復元）。DB 書き込み無し。
- **回帰 guard の意味**: TC-12 が「N 件 → batch query 1 回 / 引数長 N」を機械検証するため、
  将来 use-case 内で誤って per-member ループ内 tags 取得（N+1）を導入すると **spy 回数 > 1 で fail** する。

---

## 6.6 ローカル実行コマンド（CONST_005）

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test --run src/_shared/search-query-parser.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api test --run src/use-cases/public/__tests__/list-public-members.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api test --run src/routes/public/index.contract.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api test --run
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

---

## 6.7 DoD（Definition of Done）

- [ ] parser unit spec に TC-8〜TC-11（+ 未指定 default）を追加（whitelist / 空 / dedup / 不正単体）
- [ ] テストファイル名が全て `*.spec.ts`（不変条件 #8）
- [ ] use-case spec に TC-12/TC-13（limit=100 大量件数で batch query 1 回 + groupBy 不変）を追加
- [ ] contract spec に TC-14（whitelist 外混在 + appliedQuery 6 キー）を追加
- [ ] 全テスト green / `typecheck` / `lint` green
- [ ] N+1 回帰 guard（spy 回数 1）が将来の per-member 取得導入を検知できることを確認
- [ ] `git status apps/ packages/` 確認（本仕様書作成タスクでは実コードを書かない＝クリーン）

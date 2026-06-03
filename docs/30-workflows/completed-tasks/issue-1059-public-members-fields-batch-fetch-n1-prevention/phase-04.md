# Phase 4: テスト作成 (TDD Red)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 公開 members list の fields 一括取得 N+1 防止 (issue-1059) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト作成 (TDD Red) |
| 作成日 | 2026-06-02 |
| 状態 | completed |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装) |
| タスク種別 | implementation / NON_VISUAL / implementation_mode: new |

## 目的

Phase 2/3 で GO 判定済みの設計に対し、実装に先立つテストを定義し、同一サイクル内で GREEN 化した。
本 Phase の成果は `listFieldsByResponseIds` repository spec と use-case N+1 回帰 spec の確定である。

対象は 2 つの既存テストファイルへの追加であり、新規テストファイルは作らない。

| 追加先 | 対象 |
| --- | --- |
| `apps/api/src/repository/__tests__/responseFields.repository.spec.ts` | repository helper `listFieldsByResponseIds` の単体テスト |
| `apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts` | use-case の N+1 回帰テスト（呼び出し回数 1 / F-2 引き当て / 形状不変） |

## TDD Red / Green の記録

- RED 前提: `listFieldsByResponseIds` 未実装時は repository import が解決せず、use-case は spy 0 回で fail。
- GREEN 実測: Phase 5 実装後、use-case spec 10 PASS、repository spec 5 PASS。

## mock / private 方針

| 軸 | 方針 |
| --- | --- |
| repository テストの DB | `MockStore` + `createMockDbCtx`（既存 in-memory D1 mock）。`d1mock.ts` は `response_id IN (...)` を既にサポート済み（`applyWhere` で `bindings.includes(r["response_id"])`）のため、追加 mock 不要 |
| repository テストの fixture | `RESPONSE_FIELDS_R001`（`response_id: "r_001"` の 3 行）を流用。複数 `response_id` を扱うケースは store へ追加 row を push して構成する |
| use-case テストの DB | 既存 `createPublicD1Mock`（`public-d1.ts`）に `response_id IN` dispatch を追加し、queryLog で実 SQL を観測 |
| use-case テストの repo spy | `vi.spyOn(responseFieldsModule, "listFieldsByResponseIds")` で呼び出し回数と渡された `responseIds` を観測 |
| spy のクリーンアップ | 既存 `afterEach(() => vi.restoreAllMocks())` を流用（同ファイルに既存） |

## テスト設計1: repository helper（`responseFields.repository.spec.ts`）

既存 `describe("responseFields repository", ...)` の内側に
`describe("listFieldsByResponseIds", ...)` を追加する（`listFieldsByResponseId` の隣）。

### import 追加（RED トリガ）

```ts
import { listFieldsByResponseIds } from "../responseFields";
```

`MockStore` / `createMockDbCtx` / `RESPONSE_FIELDS_R001` / `asResponseId` は既存 import 済み。

### テストケース

| TC | 名称 | 入力 | expected |
| --- | --- | --- | --- |
| RT-1 | 空配列 → DB 非アクセスで空配列 | `listFieldsByResponseIds(ctx, [])` | `[]`（`toHaveLength(0)`）。`if (rids.length === 0) return []` の検証 |
| RT-2 | 複数 response_id でフラット配列を返す | `r_001` + 追加した `r_002` の 2 件を渡す | 2 つの response_id 分の row がフラットに 1 配列で返る。`r_001` 由来 3 行 + `r_002` 由来 N 行の合計件数 |
| RT-3 | 存在しない id を含む場合は該当分のみ返す | `[asResponseId("r_001"), asResponseId("nonexistent")]` | `r_001` の 3 行のみ。`nonexistent` 分は 0 行で混入しない |

### RT-2 の store 準備（複数 response_id）

`beforeEach` の `store.responseFields` は `RESPONSE_FIELDS_R001`（`r_001` のみ）で初期化される。
RT-2 では当該テスト内で `r_002` の row を追加する:

```ts
it("複数 response_id をまとめて取得しフラット配列で返す", async () => {
  store.responseFields.push({
    response_id: "r_002",
    stable_key: "fullName",
    value_json: JSON.stringify("佐藤 花子"),
    raw_value_json: JSON.stringify("佐藤 花子"),
  });
  const result = await listFieldsByResponseIds(ctx, [
    asResponseId("r_001"),
    asResponseId("r_002"),
  ]);
  // r_001=3 行 + r_002=1 行
  expect(result).toHaveLength(4);
  expect(result.some((r) => r.response_id === "r_001")).toBe(true);
  expect(result.some((r) => r.response_id === "r_002")).toBe(true);
});
```

### RT-1 / RT-3 の expected コード例

```ts
it("空配列を渡すと DB へアクセスせず空配列を返す", async () => {
  const result = await listFieldsByResponseIds(ctx, []);
  expect(result).toHaveLength(0);
});

it("存在しない response_id を含む場合は該当分のみ返す", async () => {
  const result = await listFieldsByResponseIds(ctx, [
    asResponseId("r_001"),
    asResponseId("nonexistent"),
  ]);
  expect(result).toHaveLength(3);
  expect(result.every((r) => r.response_id === "r_001")).toBe(true);
});
```

## テスト設計2: use-case 回帰（`list-public-members.spec.ts`）

既存ファイル末尾の issue-224 ブロック（tags batch）と対称に、fields batch の回帰ブロックを追加する。

### import 追加（spy 対象）

```ts
import * as responseFieldsModule from "../../../repository/responseFields";
```

### テストケース

| TC | 名称 | 観点 | expected |
| --- | --- | --- | --- |
| UT-1 | fields batch query が member 件数に依存せず 1 回 | AC-3（N+1 解消） | `spy` が `toHaveBeenCalledTimes(1)`。member 3 件でも 1 回 |
| UT-2 | 複数 member で値が正しく引き当たる（F-2） | groupBy キー = `response_id` の正当性 | `m-1` / `m-2` の `fullName` 等が各自の `current_response_id` 由来の値になり、混線しない |
| UT-3 | 出力 `PublicMemberListResponse` の形状・値が既存と一致 | AC-4 | `items` 各要素のフィールドが既存 happy パスと同値。`pagination.total` 不変 |

### UT-1: 呼び出し回数 1（N+1 検知の主証跡）

```ts
it("calls listFieldsByResponseIds exactly once regardless of member count (no N+1)", async () => {
  const spy = vi
    .spyOn(responseFieldsModule, "listFieldsByResponseIds")
    .mockResolvedValue([
      { response_id: "r-1", stable_key: "fullName", value_json: JSON.stringify("A"), raw_value_json: null },
      { response_id: "r-2", stable_key: "fullName", value_json: JSON.stringify("B"), raw_value_json: null },
      { response_id: "r-3", stable_key: "fullName", value_json: JSON.stringify("C"), raw_value_json: null },
    ]);
  const db = createPublicD1Mock({
    publicMembers: [
      buildPublicMemberRow({ member_id: "m-1", current_response_id: "r-1" }),
      buildPublicMemberRow({ member_id: "m-2", current_response_id: "r-2" }),
      buildPublicMemberRow({ member_id: "m-3", current_response_id: "r-3" }),
    ],
    publicMemberCount: 3,
  });

  await listPublicMembersUseCase(baseQuery, { ctx: { db: db as never } });

  expect(spy).toHaveBeenCalledTimes(1);
  const passedIds = spy.mock.calls[0]?.[1] as string[]; // 第2引数 = response_id 配列
  expect(passedIds).toEqual(["r-1", "r-2", "r-3"]);
});
```

### UT-2: F-2（response_id でキー化され混線しない）

```ts
it("resolves fields per member by response_id without cross-contamination", async () => {
  vi.spyOn(responseFieldsModule, "listFieldsByResponseIds").mockResolvedValue([
    { response_id: "r-1", stable_key: "fullName", value_json: JSON.stringify("テスト 太郎"), raw_value_json: null },
    { response_id: "r-2", stable_key: "fullName", value_json: JSON.stringify("佐藤 花子"), raw_value_json: null },
  ]);
  const db = createPublicD1Mock({
    publicMembers: [
      buildPublicMemberRow({ member_id: "m-1", current_response_id: "r-1" }),
      buildPublicMemberRow({ member_id: "m-2", current_response_id: "r-2" }),
    ],
    publicMemberCount: 2,
  });

  const result = await listPublicMembersUseCase(baseQuery, {
    ctx: { db: db as never },
  });

  const m1 = result.items.find((i) => i.memberId === "m-1");
  const m2 = result.items.find((i) => i.memberId === "m-2");
  expect(m1?.fullName).toBe("テスト 太郎");
  expect(m2?.fullName).toBe("佐藤 花子");
});
```

> **注**: `mockResolvedValue` を使うため `createPublicD1Mock` の `responseFieldsByResponseId` は
> 設定不要（repo 関数を丸ごと差し替えるため DB 経路を通らない）。

### UT-3: 出力形状・値の不変

```ts
it("keeps PublicMemberListResponse shape and values unchanged", async () => {
  vi.spyOn(responseFieldsModule, "listFieldsByResponseIds").mockResolvedValue([
    { response_id: "r-1", stable_key: "fullName", value_json: JSON.stringify("テスト 太郎"), raw_value_json: null },
    { response_id: "r-1", stable_key: "ubmZone", value_json: JSON.stringify("0_to_1"), raw_value_json: null },
  ]);
  const db = createPublicD1Mock({
    publicMembers: [
      buildPublicMemberRow({ member_id: "m-1", current_response_id: "r-1" }),
    ],
    publicMemberCount: 1,
    topTags: [{ code: "ai", label: "AI", count: 3 }],
  });

  const result = await listPublicMembersUseCase(baseQuery, {
    ctx: { db: db as never },
  });

  expect(result.items).toHaveLength(1);
  expect(result.items[0]?.fullName).toBe("テスト 太郎");
  expect(result.items[0]?.ubmZone).toBe("0_to_1");
  expect(result.pagination.total).toBe(1);
  expect(result.topTags).toEqual([{ code: "ai", label: "AI", count: 3 }]);
});
```

## RED 確認コマンド（このテストを追加した時点）

リポジトリルートから対象限定実行する:

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/api/src/repository/__tests__/responseFields.repository.spec.ts \
  apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts
```

- repository テスト: `listFieldsByResponseIds` 未定義により RED（import 解決失敗 / `is not a function`）。
- use-case テスト: UT-1 の `spy` が 0 回（use-case がまだ単数ループ）で `toHaveBeenCalledTimes(1)` FAIL。

この RED 状態を Phase 5 実装で GREEN に転じさせる。

## 実行タスク

1. repository テスト 3 件（RT-1 空配列 / RT-2 複数 id フラット / RT-3 存在しない id 混入なし）の
   command suite と expected を `responseFields.repository.spec.ts` 向けに確定する。
   完了条件: §テスト設計1 のコード例と一致し、GREEN 実測が Phase 11 に記録されている。
2. use-case 回帰 3 件（UT-1 呼び出し回数 1 / UT-2 F-2 引き当て / UT-3 形状・値不変）の
   command suite と expected を `list-public-members.spec.ts` 向けに確定する。
   完了条件: §テスト設計2 のコード例と一致し、`vi.spyOn(responseFieldsModule, "listFieldsByResponseIds")` の
   mock 戦略が明記されている。
3. mock 戦略（repository=in-memory store / use-case=repo 関数 spy）と private 方針を確定する。
   完了条件: §mock / private 方針 表が確定し、`public-d1.ts` の `response_id IN` dispatch と queryLog 観測方針が記載されている。
4. RED 確認コマンドと、RED となる根拠（未実装 import / spy 0 回）を確定する。
   完了条件: §RED 確認コマンド が記載され、Phase 5 で GREEN 化する流れが示されている。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-02.md | helper シグネチャ / 置換差分 / エッジケース |
| 必須 | phase-03.md | F-2 リスクのテスト必須化方針 |
| 必須 | apps/api/src/repository/__tests__/responseFields.repository.spec.ts | repository テスト追加先 |
| 必須 | apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts | use-case テスト追加先（tags batch TC-1〜TC-5 が同型先例） |
| 必須 | apps/api/src/repository/__fixtures__/d1mock.ts | `response_id IN (...)` 対応済み in-memory mock |
| 必須 | apps/api/src/repository/__fixtures__/members.fixture.ts | `RESPONSE_FIELDS_R001` fixture |
| 必須 | apps/api/src/use-cases/public/__tests__/helpers/public-d1.ts | `createPublicD1Mock` / `buildPublicMemberRow` / `response_id IN` dispatch |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | テスト戦略主成果物（RT-1〜RT-3 / UT-1〜UT-3 の command suite + expected + mock 戦略 + RED 根拠） |
| メタ | artifacts.json | Phase 4 状態の更新（completed） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | RED テスト群を GREEN 化する実装ランブックへ渡す。RT/UT を AC-1〜AC-4 のトレース先にする |
| Phase 6 | RT/UT を base に fail path / 回帰 guard（空 member / fields 0 件 / response_id 重複）の追加テストへ拡張 |
| Phase 7 | RT-1〜RT-3 / UT-1〜UT-3 を AC matrix の行に使用 |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] repository テスト RT-1（空配列）/ RT-2（複数 id フラット）/ RT-3（存在しない id 混入なし）の command suite と expected が確定している
- [ ] use-case 回帰 UT-1（呼び出し回数 1）/ UT-2（F-2 引き当て）/ UT-3（形状・値不変）の command suite と expected が確定している
- [ ] mock 戦略（repository=in-memory store / use-case=`vi.spyOn` repo 関数）が明記されている
- [ ] TDD Red の根拠（未実装関数 import / spy 0 回）が明記されている
- [ ] RED 確認コマンド（vitest 対象限定実行）が記載されている
- [ ] テストコード例の関数シグネチャ（`listFieldsByResponseIds(ctx, ResponseId[])`・`ResponseFieldRow` 構造）が実コードと厳密一致している

## タスク100%実行確認【必須】

- 全実行タスク（4 件）が completed（仕様確定 + GREEN 実測）
- 成果物が `outputs/phase-04/` 配下に配置済み
- 苦戦想定（F-2 取り違え / `public-d1.ts` の IN 句 dispatch / RED 状態の取り違え）が mock 方針 または テストケースで対応されている
- artifacts.json の `phases[3].status` が `completed`

## 次 Phase への引き渡し

- 次 Phase: 5 (実装)
- 引き継ぎ事項:
  - RED テスト群（RT-1〜RT-3 / UT-1〜UT-3）と expected result
  - mock 戦略（repository=store push / use-case=repo 関数 spy）
  - `public-d1.ts` が `response_id IN (...)` dispatch を持ち、queryLog と repo 関数 spy で観測する制約
  - RED → GREEN の遷移基準（実装で `listFieldsByResponseIds` 追加 + ループ置換）と GREEN 実測
- ブロック条件:
  - テストが出力形状の変化を期待する設計になっている（AC-4 違反）
  - groupBy キーを `member_id` で検証している（F-2 違反）

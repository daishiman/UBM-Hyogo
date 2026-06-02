# Phase 5: 実装（TDD Green フェーズ）

> **Phase 種別**: 実装（Phase 4 のテストを green にする）
> **対象 issue**: #224 公開 members list の tags 一括取得 N+1 防止
> **前提**: Phase 4 のテストが Red になっている
> **次フェーズ**: Phase 6（テスト拡充）

---

## 5.1 このフェーズのゴール

Phase 4 で定義した TC-1〜TC-7 を green にする最小実装を行う。
`/public/members?expand=tags` のとき、`listTagsByMemberIds`（`member_id IN (...)` の 1 batch query）で
全 member の tags をまとめて取得し、use-case 層で `member_id` をキーに groupBy して各 item に素通しする。

`listTagsByMemberIds` helper（repository）は **無改変**（既存のフラット配列返却をそのまま利用）。

---

## 5.2 変更対象ファイル一覧と種別（CONST_005）

| # | ファイル | 種別 | 変更内容 |
|---|---------|------|----------|
| 1 | `apps/api/src/_shared/search-query-parser.ts` | 編集 | `ParsedPublicMemberQuery.expand` / `RawZ.expand` / `DEFAULT` / parse 反映 |
| 2 | `packages/shared/src/zod/viewmodel.ts` | 編集 | `PublicMemberTagZ` 追加 + `PublicMemberListItemZ.tags` optional |
| 3 | `packages/shared/src/types/viewmodel/index.ts` | 編集 | `PublicMemberListItem.tags?` 追加（+ 必要なら `PublicMemberTag` 型 export） |
| 4 | `apps/api/src/view-models/public/public-member-list-view.ts` | 編集 | `PublicMemberListItemSource.tags?` 追加（`stripForbidden` 素通し） |
| 5 | `apps/api/src/use-cases/public/list-public-members.ts` | 編集 | `wantTags` 判定 + `listTagsByMemberIds` 1 回呼出 + groupBy + merge |
| 6 | `apps/api/src/use-cases/public/__tests__/helpers/public-d1.ts` | 編集 | `member_tags ... member_id IN` 分岐を mock に追加（contract で tags 実体化） |
| - | `apps/api/src/repository/memberTags.ts` | **無改変** | `listTagsByMemberIds` をそのまま利用 |

> #2 の `PublicMemberTagZ` が `@ubm-hyogo/shared` 経由で参照可能になるよう、shared の export 集約
> （`packages/shared/src/zod/index.ts` 等の barrel）に追従させる。barrel が `export * from "./viewmodel"` 形式なら
> `export const PublicMemberTagZ` は自動的に再 export される（追記不要）。typecheck で `import { PublicMemberTag } from "@ubm-hyogo/shared"` が解決することを確認する。

---

## 5.3 関数・型シグネチャ（CONST_005）

### 5.3.1 search-query-parser.ts

実コードの流儀（`RawZ.safeParse` + 失敗時 `DEFAULT_PUBLIC_MEMBER_QUERY` fallback、`tags` の split/dedup）に整合させる。

```typescript
const EXPAND_WHITELIST = ["tags"] as const;
type ExpandKey = (typeof EXPAND_WHITELIST)[number];

// 1) 型に追加
export type ParsedPublicMemberQuery = {
  q: string;
  zone: string;
  status: string;
  tags: string[];
  sort: z.infer<typeof SortZ>;
  density: z.infer<typeof DensityZ>;
  page: number;
  limit: number;
  expand: ExpandKey[]; // ← 追加（常に配列・default []）
};

// 2) DEFAULT に追加（既存の実値: zone/status="all", sort="recent", density="comfy", limit=24）
export const DEFAULT_PUBLIC_MEMBER_QUERY: ParsedPublicMemberQuery = {
  q: "",
  zone: "all",
  status: "all",
  tags: [],
  sort: "recent",
  density: "comfy",
  page: 1,
  limit: 24,
  expand: [], // ← 追加
};
```

`RawZ` への追加と parse 本体は **`tags` と同じ前処理パターン**（repeated param / カンマ区切り両対応）を踏襲する。

```typescript
// RawZ.shape に追加
//   expand: z.array(z.string()).default([]),

// parsePublicMemberQuery 内: tags と同じ流儀で expand を前処理してから safeParse に渡す
const expandRaw = raw.expand;
const expandList = (
  Array.isArray(expandRaw) ? expandRaw : expandRaw ? [expandRaw] : []
)
  .filter((e): e is string => typeof e === "string")
  .flatMap((e) => e.split(","))
  .map((e) => e.trim())
  .filter((e): e is ExpandKey =>
    (EXPAND_WHITELIST as readonly string[]).includes(e),
  );

// RawZ.safeParse({ ...既存..., expand: expandList }) のように渡し、
// 返却オブジェクトに追記:
return {
  // ...既存 q/zone/status/tags/sort/density/page/limit...
  expand: Array.from(new Set(data.expand as ExpandKey[])),
};
```

> 防御方針: 未知値・空文字は黙って除外し、結果は常に配列（default `[]`）。
> `expand` 単体が不正でも `RawZ.safeParse` は他フィールドを巻き込んで default に落とさない
> （前処理で whitelist filter 済みの値だけ渡すため、`z.array(z.string())` は必ず成功する）。

### 5.3.2 shared zod（`packages/shared/src/zod/viewmodel.ts`）

```typescript
export const PublicMemberTagZ = z.object({
  code: z.string(),
  label: z.string(),
  category: z.string(),
});
export type PublicMemberTag = z.infer<typeof PublicMemberTagZ>;

export const PublicMemberListItemZ = z.object({
  memberId: z.string().min(1),
  fullName: z.string(),
  nickname: z.string(),
  occupation: z.string(),
  location: z.string(),
  ubmZone: z.string().nullable(),
  ubmMembershipType: z.string().nullable(),
  tags: z.array(PublicMemberTagZ).optional(), // ← 追加（未指定時 undefined＝キー無し）
});
```

> **重要**: `PublicMemberListItemZ` は非 strict のため `tags` 追加で安全。
> トップレベルの `PublicMemberListViewZ` は `.strict()`（item ではなく view object 全体に適用）であり、
> その `appliedQuery` は **6 キー固定**（q/zone/status/tags/sort/density）。**ここに `expand` を追加しない**（TC-7）。

### 5.3.3 shared 型（`packages/shared/src/types/viewmodel/index.ts`）

```typescript
export interface PublicMemberListItem {
  memberId: MemberId;
  fullName: string;
  nickname: string;
  occupation: string;
  location: string;
  ubmZone: string | null;
  ubmMembershipType: string | null;
  tags?: ReadonlyArray<{ code: string; label: string; category: string }>; // ← 追加
}
```

> この手書き型と `PublicMemberListItemZ`（zod infer）の整合を保つ。
> 既に zod infer を re-export している構成なら手書き interface 側の追記は不要な場合がある。
> 実ファイル構成を確認し、zod 由来の型が正本ならそちらに一本化する（重複定義を増やさない）。

### 5.3.4 view-model（`public-member-list-view.ts`）

`PublicMemberListItemSource` に `tags?` を追加。`stripForbidden` は `FORBIDDEN_KEYS`
（responseEmail / rulesConsent / adminNotes）のみ削除するため **tags は素通し**。

```typescript
export interface PublicMemberListItemSource {
  memberId: string;
  fullName: string;
  nickname: string;
  occupation: string;
  location: string;
  ubmZone: string | null;
  ubmMembershipType: string | null;
  tags?: ReadonlyArray<{ code: string; label: string; category: string }>; // ← 追加
  // responseEmail / rulesConsent / adminNotes は引き続き含めない（forbidden）
}
```

`toPublicMemberListView` 本体は **無改変で良い**。理由: 現実装は
`src.items.map((item) => stripForbidden(item as ... Record))` で item をそのまま通すため、
source object に `tags` キーが含まれていれば（use-case が条件付きで付与する）そのまま残り、
含まれていなければキー自体が無い。`PublicMemberListResponseZ.parse` は `tags` optional を通す。

> use-case 側で「`wantTags` のときだけ source に `tags` キーを載せる」ことで、AC-3（未指定で tags キー無し）を
> schema optional + builder の二重で保証する（Phase 3 決定事項 6）。

### 5.3.5 use-case（`list-public-members.ts`）

import を追加し、`Promise.all` 後・items 組成前に tags batch を取得して Map 化する。

```typescript
import { listTagsByMemberIds } from "../../repository/memberTags";
import { asMemberId } from "@ubm-hyogo/shared"; // ★ import 経路は 5.4 で確認
```

```typescript
const [memberRows, total, topTags] = await Promise.all([
  listPublicMembers(ctx, repoInput),
  countPublicMembers(ctx, repoInput),
  aggregateTopTags(ctx),
]);

// --- tags batch（expand=tags のときだけ 1 query） ---
const wantTags = query.expand.includes("tags");
let tagsByMember: Map<string, { code: string; label: string; category: string }[]> | undefined;
if (wantTags && memberRows.length > 0) {
  const memberIds = memberRows.map((m) => asMemberId(m.member_id));
  const tagRows = await listTagsByMemberIds(ctx, memberIds); // 1 query・フラット配列
  tagsByMember = new Map();
  for (const r of tagRows) {
    const arr = tagsByMember.get(r.member_id) ?? [];
    // 公開レスポンスは code/label/category のみ（confidence/source 等は載せない）
    arr.push({ code: r.code, label: r.label, category: r.category });
    tagsByMember.set(r.member_id, arr);
  }
}

// 既存の for ループ内 items.push に spread で tags を条件付与
items.push({
  memberId: m.member_id,
  fullName: parseJsonString(byKey.get(STABLE_KEY.fullName) ?? null),
  nickname: parseJsonString(byKey.get(STABLE_KEY.nickname) ?? null),
  occupation: parseJsonString(byKey.get(STABLE_KEY.occupation) ?? null),
  location: parseJsonString(byKey.get(STABLE_KEY.location) ?? null),
  ubmZone: parseJsonNullable(byKey.get(STABLE_KEY.ubmZone) ?? null),
  ubmMembershipType: parseJsonNullable(byKey.get(STABLE_KEY.ubmMembershipType) ?? null),
  // wantTags のときだけ tags を付与（未登録 member は空配列）
  ...(wantTags ? { tags: tagsByMember?.get(m.member_id) ?? [] } : {}),
});
```

> `toPublicMemberListView({ items, pagination, appliedQuery, topTags, generatedAt })` の呼び出しは
> **オブジェクト引数のまま無改変**。`appliedQuery` も既存 6 キーのまま（expand を足さない）。

### 5.3.6 D1 mock 拡張（`__tests__/helpers/public-d1.ts`）

contract test（TC-6）で tags を実体化するため、`MockStmt.all<T>()` 内に
`listTagsByMemberIds` の batch SQL（`FROM member_tags mt ... WHERE mt.member_id IN (...)`）分岐を追加する。
**既存の単一 id 分岐（`mt.member_id = ?1`、行 178-185 付近）と、tag aggregation 分岐（`GROUP BY td.code`、行 191-197 付近）の
どちらとも衝突しないよう、`member_id IN` を条件に含めて限定する**（`= ?1` を含まず `IN` を含むため誤マッチしない）。

既存の `tagsByMemberId: Record<string, unknown[]>`（行 178-185 で単一 id 用に既に使われている fixture）を
**batch でも再利用**する。`this.bindings` は `listTagsByMemberIds` が `.bind(...mids)` で渡した member_id 配列。

```typescript
// MockStmt.all<T>() 内に追加（既存の "mt.member_id = ?1" 分岐／"GROUP BY td.code" 分岐の手前に置く）:
if (
  sql.includes("FROM member_tags mt") &&
  sql.includes("JOIN tag_definitions td") &&
  sql.includes("member_id IN")
) {
  const byMember = this.options.tagsByMemberId ?? {};
  const rows: unknown[] = [];
  for (const mid of this.bindings) {
    const key = String(mid);
    for (const r of (byMember[key] ?? [])) rows.push(r);
  }
  return { results: rows as T[] };
}
```

> - 既存の単一 id 分岐は `sql.includes("mt.member_id = ?1")` で限定されており、`member_id IN` を含まないため衝突しない。
> - tag aggregation 分岐は `GROUP BY td.code` を含み、`member_id IN` を含まないため衝突しない。
> - `this.bindings` に含まれる member_id のみ（= visibility filter 通過後の `publicMembers` 由来）を返すため、
>   除外 member の tag は mock レベルでも leak しない（AC-4）。
> - fixture の `tagsByMemberId[mid]` 各行は `listTagsByMemberIds` の返却型（`MemberTagWithDefinition`）に揃え、
>   少なくとも `member_id` / `code` / `label` / `category` を含める（contract spec 側の fixture を参照）。

---

## 5.4 引き当てキーの明示（取り違え防止）

| 情報 | 引き当てキー | コード上の対応 |
|------|------------|---------------|
| **tags** | `member_id` | `tagsByMember.get(m.member_id)` / flat 行の `r.member_id` で push 集約 |
| **fields** | `current_response_id` | `listFieldsByResponseId(ctx, m.current_response_id)`（既存・本 issue スコープ外の別系統 N+1） |

> tags を `current_response_id` で、fields を `member_id` で引くと取り違えになる。上表を厳守する。
> `listTagsByMemberIds` の返却は **`member_id` を持つフラット配列**であり、groupBy は use-case 層の責務（helper はしない）。

---

## 5.5 `asMemberId` import 経路の確認手順

`listTagsByMemberIds(c, mids: MemberId[])` は `MemberId` branded type を要求する。
`memberRows[].member_id` は `string` なので変換する。import 経路を以下で確認する。

```bash
# asMemberId / MemberId の export 元を確認（shared 由来か repository/_shared/brand 由来か）
grep -rn "export .*asMemberId" packages/shared/src apps/api/src/repository/_shared/brand.ts 2>/dev/null
# 既存 use-case / repository での import 慣例（同じ経路に合わせる）
grep -rn "asMemberId" apps/api/src | head
```

- `@ubm-hyogo/shared` から `asMemberId` が export されていれば `import { asMemberId } from "@ubm-hyogo/shared";`。
- repository ローカル brand なら `import { asMemberId } from "../../repository/_shared/brand";`。
- どちらも無い場合のみ `m.member_id as MemberId`（`import type { MemberId } from "../../repository/_shared/brand"`）で代替（最終手段）。
- `mise exec -- pnpm typecheck` が通る経路を正とする。

---

## 5.6 入出力・副作用

- **入力**: `ParsedPublicMemberQuery`（`expand` 含む）, `DbCtx`。
- **出力**: `PublicMemberListResponse`。`expand=tags` 時のみ `items[].tags`（code/label/category）を含む。
- **副作用**: D1 read のみ。`listTagsByMemberIds` の 1 batch query を `wantTags && memberRows.length>0` のときだけ追加発行。書き込み無し。
- **クエリ発行回数**: tags batch query は最大 1 回（members 0 件 / expand 未指定なら 0 回）。fields の per-member クエリは既存挙動のまま（本 issue で増減させない）。

---

## 5.7 後方互換性の確認

- `expand` 未指定: `query.expand = []` → `wantTags=false` → tags 取得しない／source に tags キーを載せない → 既存レスポンス shape と byte 互換（TC-4 / 既存 contract test）。
- `appliedQuery` は 6 キー固定のまま → 既存 contract（`appliedQuery` matchObject）が回帰しない（TC-7）。
- `PublicMemberListItemZ.tags` は optional → 既存 tags 無しレスポンスが parse を通る。
- `listTagsByMemberIds` 無改変 → admin / 他経路の利用に影響なし。
- D1 mock 拡張は `member_id IN` の新分岐追加のみで既存 4 分岐に影響しない。

---

## 5.8 ローカル実行コマンド（CONST_005）

```bash
mise exec -- pnpm --filter @ubm-hyogo/shared test --run
mise exec -- pnpm --filter @ubm-hyogo/api test --run
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

---

## 5.9 DoD（Definition of Done）

- [ ] `search-query-parser.ts` に `expand`（型 / RawZ / DEFAULT / parse 返却）を追加し whitelist=`["tags"]` で正規化＋dedup
- [ ] `viewmodel.ts` に `PublicMemberTagZ` + `tags` optional を追加（appliedQuery は 6 キーのまま）
- [ ] shared 型（`types/viewmodel/index.ts`）に `tags?` を追加（zod infer 正本なら重複を作らない）
- [ ] shared から `PublicMemberTag(Z)` が `@ubm-hyogo/shared` 経由で参照できる
- [ ] `PublicMemberListItemSource` に `tags?` を追加（view-model 本体は無改変で素通し）
- [ ] use-case で `wantTags` 判定 → `listTagsByMemberIds` 1 回呼出 → `member_id` で groupBy → spread merge
- [ ] `listTagsByMemberIds` helper は無改変
- [ ] D1 mock に `member_id IN` 分岐を追加し contract TC-6 が実体 tags で green
- [ ] Phase 4 の TC-1〜TC-7 が **green**
- [ ] 既存 contract / use-case test が回帰しない
- [ ] `mise exec -- pnpm typecheck` / `pnpm lint` が green
- [ ] `git status apps/ packages/` 確認（本仕様書作成タスクでは実コードを書かない＝クリーン）

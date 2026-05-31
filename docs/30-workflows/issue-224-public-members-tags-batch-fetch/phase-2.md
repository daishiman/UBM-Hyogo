# Phase 2: 設計

## 目的

`expand=tags` を opt-in として、既存 batch helper `listTagsByMemberIds`（フラット配列を返す）を
use-case に配線し、memberId で groupBy して応答 schema を tags 拡張する設計を、実コードの
シグネチャに整合させて固定する。

## 設計方針（データフロー）

```
route (members.ts)  ※変更なし（searchParams 全取り込みで expand も raw に入る）
  └─ parsePublicMemberQuery(raw) → query.expand: ("tags")[]（常に配列・default []）
       └─ listPublicMembersUseCase(query, { ctx })
            1. Promise.all([listPublicMembers, countPublicMembers, aggregateTopTags])（既存・visibility filter 適用）
            2. memberRows（PublicMemberRow[]）から fields を member 毎取得（既存 N+1・別系統・本issue非対象）
            3. wantTags = query.expand.includes("tags")
               wantTags のとき:
                 memberIds = memberRows.map(m => asMemberId(m.member_id))
                 tagRows   = await listTagsByMemberIds(ctx, memberIds)  ← 1 query・フラット配列
                 byMember  = groupBy(tagRows, r => r.member_id) → Map<string, {code,label,category}[]>
               未指定のとき:
                 byMember  = undefined（query 発行なし）
            4. item を push する際:
                 ...(wantTags ? { tags: byMember.get(m.member_id) ?? [] } : {})
       └─ toPublicMemberListView: stripForbidden（tags は forbidden でない＝素通し）→ PublicMemberListResponseZ.parse
  └─ shared zod: PublicMemberListItemZ.tags = optional（未指定時はキー自体が無い）
```

## 変更レイヤと責務（状態所有権）

| レイヤ              | ファイル                                                      | 責務                                                       | 変更種別 |
| ------------------- | ------------------------------------------------------------ | ---------------------------------------------------------- | -------- |
| query parse         | `apps/api/src/_shared/search-query-parser.ts`                | `expand` の解釈（whitelist `tags` のみ・常に配列）         | 編集     |
| shared contract     | `packages/shared/src/zod/viewmodel.ts`                       | `PublicMemberTagZ` 新規 + `PublicMemberListItemZ.tags` optional | 編集 |
| shared 型           | `packages/shared/src/types/viewmodel/index.ts`              | `PublicMemberListItem.tags?` 追加                          | 編集     |
| view-model          | `apps/api/src/view-models/public/public-member-list-view.ts` | `PublicMemberListItemSource.tags?` 追加（builder は use-case 側） | 編集 |
| use-case orchestrate | `apps/api/src/use-cases/public/list-public-members.ts`      | expand 判定 → batch helper 1回 → groupBy → 引き当て         | 編集     |
| repository（既存）   | `apps/api/src/repository/memberTags.ts`                      | `listTagsByMemberIds`（`member_id IN` batch）              | **変更なし・再利用** |
| route               | `apps/api/src/routes/public/members.ts`                      | searchParams 全取り込み                                    | **変更なし** |

## インターフェース設計（実コード verbatim 反映）

### 1. expand パース（`search-query-parser.ts`）

```typescript
const EXPAND_WHITELIST = ["tags"] as const;
type ExpandKey = (typeof EXPAND_WHITELIST)[number];

// RawZ に追加（repeated param / カンマ区切り両対応のため前処理してから配列で渡す）
// RawZ.shape に: expand: z.array(z.enum(EXPAND_WHITELIST)).default([])

// ParsedPublicMemberQuery type に追加:
//   expand: ExpandKey[];

// DEFAULT_PUBLIC_MEMBER_QUERY に: expand: []

// parse 本体（parsePublicMemberQuery 内）:
const expandRaw = raw.expand;                       // string | string[] | undefined
const expandList = (Array.isArray(expandRaw) ? expandRaw : expandRaw ? [expandRaw] : [])
  .flatMap((e) => e.split(","))
  .map((e) => e.trim())
  .filter((e): e is ExpandKey => (EXPAND_WHITELIST as readonly string[]).includes(e));
// safeParse 後の返却に:
//   expand: Array.from(new Set(expandList)),
```

> 防御的方針: 未知値・空は黙って除外し、結果は常に配列（default `[]`）。既存 `.catch()`/`safeParse` 流儀に整合。

### 2. shared zod 拡張（`packages/shared/src/zod/viewmodel.ts`）

```typescript
export const PublicMemberTagZ = z.object({
  code: z.string(),
  label: z.string(),
  category: z.string(),
});

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

export type PublicMemberTag = z.infer<typeof PublicMemberTagZ>;
```

> `PublicMemberListItemZ` は非 strict のため tags 追加で既存 strict test（トップレベル `PublicMemberListViewZ.strict()`）に影響しない。
> `appliedQuery` は `.strict()` のため **expand を含めない**（含めると既存 contract test が落ちる）。

### 3. shared 型（`packages/shared/src/types/viewmodel/index.ts`）

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

### 4. view-model（`public-member-list-view.ts`）

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

> `stripForbidden` は `FORBIDDEN_KEYS`（responseEmail/rulesConsent/adminNotes）のみ削除するため tags は素通し。
> `toPublicMemberListView` の `PublicMemberListResponseZ.parse` は `PublicMemberListItemZ.tags` optional を通す。

### 5. use-case 配線（`list-public-members.ts`）

```typescript
import { listTagsByMemberIds } from "../../repository/memberTags";
import { asMemberId } from "@ubm-hyogo/shared"; // or repository/_shared/brand（既存 import 経路に合わせる）

// memberRows 取得後（fields ループは既存のまま）:
const wantTags = query.expand.includes("tags");
let tagsByMember: Map<string, { code: string; label: string; category: string }[]> | undefined;
if (wantTags) {
  const memberIds = memberRows.map((m) => asMemberId(m.member_id));
  const tagRows = await listTagsByMemberIds(ctx, memberIds); // ← 1 query のみ（フラット配列）
  tagsByMember = new Map();
  for (const r of tagRows) {
    const arr = tagsByMember.get(r.member_id) ?? [];
    arr.push({ code: r.code, label: r.label, category: r.category });
    tagsByMember.set(r.member_id, arr);
  }
}

// items.push 時:
items.push({
  memberId: m.member_id,
  fullName: ...,
  // ...既存 fields...
  ...(wantTags ? { tags: tagsByMember!.get(m.member_id) ?? [] } : {}),
});
```

> 引き当てキーの取り違え注意: **tags は `member_id`**、fields は `current_response_id`。
> `asMemberId` の import 経路は既存コードの brand 利用箇所に合わせる（Phase 5 で確認）。

## visibility 整合（leak 防御 / AC-4）

- `memberIds` は `listPublicMembers`（= `buildBaseFromWhere` の visibility filter 適用済み）結果から構築。
- 非公開 member は `memberRows` に存在しないため、その memberId で tags を引くことはない。
- `listTagsByMemberIds` は渡された memberId 集合に対してのみ JOIN。leak 経路なし。

## query 回数の整理（AC-2 / AC-3）

| ケース        | list | count | topTags | fields            | tags batch | tags が件数比例か |
| ------------- | ---- | ----- | ------- | ----------------- | ---------- | ----------------- |
| expand 未指定 | 1    | 1     | 1       | N（既存N+1・別issue） | **0**      | —                 |
| expand=tags   | 1    | 1     | 1       | N（既存N+1・別issue） | **1**（IN batch） | **No（1固定）** |

> contract / use-case test は **tags batch query（`member_tags ... member_id IN`）のみ**を計数し、
> 「member 件数を増やしても tags batch query が 1 のまま」を assert する（fields N+1 は assert 対象外＝本 issue スコープ外）。

## ライブラリ選定

新規ライブラリ採用なし。既存 zod / D1 prepared statement / `placeholders` helper のみ。複合フィールド semantics の懸念なし。

## 既存コンポーネント再利用可否（FB-SDK-07-1）

- batch helper `listTagsByMemberIds` を **そのまま再利用**（新規 query 実装ゼロ）。
- zod `<Name>Z` / parser の split・dedup 規約 / view-model の forbidden-strip パターンを踏襲。新規 primitive を生やさない。

## 参照

- `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md`
- `.claude/skills/aiworkflow-requirements/references/error-handling.md`

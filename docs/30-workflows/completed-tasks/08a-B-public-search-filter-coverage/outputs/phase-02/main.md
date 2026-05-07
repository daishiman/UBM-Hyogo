# Phase 2 出力 — 設計

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 08a-B-public-search-filter-coverage |
| phase | 2 / 13 |
| wave | 08a-fu |
| mode | parallel |
| 作成日 | 2026-05-04 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |

## 実装区分宣言

`[実装区分: 実装仕様書]`。Phase 1 と同じ判定根拠（`apps/api/src/_shared/search-query-parser.ts` 等 5 系統）。Phase 2 では URL → page → fetcher → API → D1 → response → UI の経路を実装可能粒度で固定する。

## API 設計

### エンドポイント

`GET /public/members`（apps/api 側 mount path は `/public/members`、`apps/web/src/lib/fetch/public.ts` は `/public/...` path を service binding または `PUBLIC_API_BASE_URL` にそのまま結合する）。

- 認証: 不要
- Cache-Control: `no-store`（admin の publishState 変更を即時反映）
- Content-Type: `application/json; charset=utf-8`

### query schema（zod）

実装ファイル: `apps/api/src/_shared/search-query-parser.ts`（`parsePublicMemberQuery`）

| key | zod 型 | 既定値 | 上限 / 制約 |
| --- | --- | --- | --- |
| `q` | `z.string()` → trim + 空白正規化 + 200 文字 truncate | `""` | 200 文字 |
| `zone` | `z.string()` → enum allowlist (`all` / `0_to_1` / `1_to_10` / `10_to_100`) | `"all"` | enum 外は `all` |
| `status` | `z.string()` → enum allowlist (`all` / `member` / `non_member` / `academy`) | `"all"` | enum 外は `all` |
| `tag` | `z.array(z.string())` → dedup + slice(0,5) | `[]` | 最大 5 件、repeated query 受け取り |
| `sort` | `z.enum(["recent","name"]).catch("recent")` | `"recent"` | enum 外は `recent` |
| `density` | `z.enum(["comfy","dense","list"]).catch("comfy")` | `"comfy"` | enum 外は `comfy` |
| `page` | `z.coerce.number().int().catch(1)` | `1` | 下限 1 |
| `limit` | `z.coerce.number().int().catch(24)` | `24` | clamp [1, 100] |

すべての parse 失敗は **黙って default に fallback**（`parsePublicMemberQuery` の `safeParse` + `catch`）。HTTP 400 は返さない（公開導線で UX を壊さないため AC-V1）。

### response schema

正本: `packages/shared/src/zod/viewmodel.ts` の `PublicMemberListViewZ`（`.strict()`）

```ts
{
  items: Array<{
    memberId: string;        // 公開 ID
    fullName: string;
    nickname: string;
    occupation: string;
    location: string;
    ubmZone: string | null;
    ubmMembershipType: string | null;
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  appliedQuery: {
    q: string;
    zone: string;
    status: string;
    tags: string[];
    sort: "recent" | "name";
    density: "comfy" | "dense" | "list";
  };
  generatedAt: string; // ISO 8601
}
```

`facets`（zone 別 / status 別 / tag 別件数）は本タスクでは out-of-scope。`stats` 系は `aggregatePublicZones` / `aggregatePublicMemberships` に既存だが `/public/members` には合流させない（08a-A 側で扱い済み）。

### admin-only field 除外の実装方針

1. `view-models/public/public-member-list-view.ts` の `toPublicMemberListView` で `PublicMemberListItemZ` を通し、未許可 key は `.strict()` で reject
2. repository の SELECT 句は `mi.member_id, mi.current_response_id, mi.last_submitted_at` のみ（`responseEmail` / `publishState` 等を取らない）
3. `listFieldsByResponseId` の戻りから `SUMMARY_KEYS` allowlist で抜き出し、それ以外は破棄
4. summary 用 stable_key に admin-only な `responseEmail` / `publicConsent` / `rulesConsent` を **含めない**（既存実装で確認済み）

## 変更対象ファイル候補一覧（既存実装パスを Grep で確認）

### apps/api 側

| パス | 役割 | 想定変更分類 |
| --- | --- | --- |
| `apps/api/src/_shared/search-query-parser.ts` | query parse / clamp / fallback | 編集 |
| `apps/api/src/routes/public/members.ts` | hono handler / Cache-Control | 編集（必要時） |
| `apps/api/src/use-cases/public/list-public-members.ts` | use case 組成 | 編集（必要時） |
| `apps/api/src/repository/publicMembers.ts` | D1 join / where / order by | 編集（sort=name の `fullName` 順検討） |
| `apps/api/src/view-models/public/public-member-list-view.ts` | view 変換 / strict reject | 編集（必要時） |
| `apps/api/src/__tests__/...` / `apps/api/src/repository/publicMembers.test.ts` | unit / integration | 追加 |

### apps/web 側

| パス | 役割 | 想定変更分類 |
| --- | --- | --- |
| `apps/web/app/(public)/members/page.tsx` | Server Component / searchParams parse | 編集（必要時） |
| `apps/web/app/(public)/members/_components/MembersFilterBar.client.tsx` | filter UI / `router.replace` | 編集（a11y / aria 追加） |
| `apps/web/app/(public)/members/_components/MemberList.tsx` | list / density 切替 | 編集（必要時） |
| `apps/web/src/lib/url/members-search.ts` | URL ↔ MembersSearch / `toApiQuery` | 編集（必要時） |
| `apps/web/src/lib/fetch/public.ts` | public API fetcher | 参照のみ |
| `apps/web/src/components/feedback/EmptyState.tsx` | 空状態 + reset link | 参照のみ |
| `apps/web/src/lib/url/__tests__/members-search.test.ts` | unit | 追加 |

### shared

| パス | 役割 | 想定変更分類 |
| --- | --- | --- |
| `packages/shared/src/zod/viewmodel.ts` (`PublicMemberListViewZ`) | response strict schema | 参照のみ |
| `packages/shared/src/types/viewmodel/index.ts` (`PublicMemberListView`) | TS interface | 参照のみ |

## 主要関数・型のシグネチャ案

```ts
// apps/api/src/_shared/search-query-parser.ts
export type ParsedPublicMemberQuery = {
  q: string;
  zone: "all" | "0_to_1" | "1_to_10" | "10_to_100";
  status: "all" | "member" | "non_member" | "academy";
  tags: string[];                    // dedup、最大 5
  sort: "recent" | "name";
  density: "comfy" | "dense" | "list";
  page: number;                      // >=1
  limit: number;                     // 1..100
};

export const parsePublicMemberQuery: (
  raw: Record<string, string | string[] | undefined>,
) => ParsedPublicMemberQuery;
```

```ts
// apps/api/src/repository/publicMembers.ts
export interface ListPublicMembersInput {
  readonly q: string;
  readonly zone: string;
  readonly status: string;
  readonly tagCodes: readonly string[];
  readonly sort: "recent" | "name";
  readonly page: number;
  readonly limit: number;
}

export const listPublicMembers: (
  c: DbCtx, input: ListPublicMembersInput,
) => Promise<PublicMemberRow[]>;

export const countPublicMembers: (
  c: DbCtx, input: ListPublicMembersInput,
) => Promise<number>;
```

```ts
// apps/api/src/use-cases/public/list-public-members.ts
export const listPublicMembersUseCase: (
  query: ParsedPublicMemberQuery,
  deps: { ctx: DbCtx },
) => Promise<PublicMemberListResponse>;
```

```ts
// apps/web/src/lib/url/members-search.ts
export type MembersSearch = {
  q: string;
  zone: "all" | "0_to_1" | "1_to_10" | "10_to_100";
  status: "all" | "member" | "non_member" | "academy";
  tag: string[];
  sort: "recent" | "name";
  density: "comfy" | "dense" | "list";
};

export const parseSearchParams: (
  searchParams: Record<string, string | string[] | undefined>,
) => MembersSearch;

export const toApiQuery: (search: MembersSearch) => URLSearchParams;
```

## データフロー（テキスト図）

```
User 操作（input / select / segmented）
  └─> MembersFilterBar.client (apps/web)
        └─> useRouter().replace("/members?<qs>")    [history を汚染しない / AC-AC-V1 reload で復元]
              └─> Next.js Server Component: page.tsx
                    └─> parseSearchParams() → MembersSearch（URL 正本 / 不変条件 #8）
                          └─> toApiQuery() → URLSearchParams
                                └─> fetchPublic("/public/members?...")
                                      └─> apps/api hono `/public/members`
                                            └─> parsePublicMemberQuery()    [fallback / clamp]
                                                  └─> listPublicMembersUseCase()
                                                        ├─> countPublicMembers()
                                                        ├─> listPublicMembers()  [D1 JOIN/WHERE/ORDER BY]
                                                        └─> listFieldsByResponseId() × N  [SUMMARY_KEYS allowlist]
                                            └─> toPublicMemberListView() [strict reject]
                                            └─> JSON 200 + Cache-Control: no-store
                                └─> Server Component で受領
                          └─> MemberList / EmptyState / MembersFilterBar に props として渡す
              └─> Client が初期状態を URL から復元
```

## D1 クエリ設計

実装は `apps/api/src/repository/publicMembers.ts` `buildBaseFromWhere`。

### ベース WHERE（公開可視性）

```sql
FROM member_identities mi
  JOIN member_status s     ON s.member_id = mi.member_id
  JOIN member_responses r  ON r.response_id = mi.current_response_id
WHERE s.public_consent = 'consented'
  AND s.publish_state  = 'public'
  AND s.is_deleted     = 0
  AND mi.member_id NOT IN (SELECT source_member_id FROM identity_aliases)
```

### q 部分一致

```sql
AND r.search_text LIKE ?    -- bind: "%<q>%"
```

`search_text` は 03b sync 時に searchable=1 の field を concat 済み（`fullName` / `nickname` / `occupation` / `location` / `businessOverview` / `skills` / `canProvide` / `selfIntroduction` / `tags`）。

### zone / status

```sql
AND EXISTS (
  SELECT 1 FROM response_fields rf_zone
  WHERE rf_zone.response_id = mi.current_response_id
    AND rf_zone.stable_key  = 'ubmZone'
    AND rf_zone.value_json  = ?              -- bind: JSON.stringify(zone)
)
-- status も同形（stable_key='ubmMembershipType'）
```

### tag AND

```sql
AND mi.member_id IN (
  SELECT mt.member_id FROM member_tags mt
  JOIN tag_definitions td ON td.tag_id = mt.tag_id
  WHERE td.code IN (?, ?, ?)                -- bind: tagCodes[]
  GROUP BY mt.member_id
  HAVING COUNT(DISTINCT td.code) = ?         -- bind: tagCodes.length
)
```

### ORDER BY / LIMIT

```sql
GROUP BY mi.member_id
ORDER BY mi.last_submitted_at DESC, mi.fullName ASC, member_id ASC   -- sort=recent
-- または ORDER BY mi.fullName ASC, member_id ASC                     -- sort=name
LIMIT ? OFFSET ?
```

> 備考: `sort=name` は本来 `fullName` 昇順が望ましいが、`fullName` は `response_fields.value_json` に格納されているため LATERAL JOIN なしでは ORDER BY できない。MVP は `fullName ASC, member_id ASC` で代替し、Phase 3 レビューで採否を確定する（後続改善 issue 候補）。

### COUNT クエリ

`SELECT COUNT(DISTINCT mi.member_id) AS cnt <fromWhere>`（pagination 用 total）。

## URL 同期方針

| 観点 | 採用 | 理由 |
| --- | --- | --- |
| `router.replace` | ✅ | 履歴汚染回避（filter 操作は戻る対象外）|
| `router.push` | ❌ | 戻るボタンで意図せず初期化される |
| `history.pushState` 直接 | ❌ | Next.js App Router の Server Component 再 fetch を skip してしまう |
| 初期値の URL 表示 | ❌（省略する） | `?zone=all&status=all&sort=recent&density=comfy` を URL に出さない（`toApiQuery` で if guard） |
| `q` 入力 debounce | Phase 5 で 300ms 採用 | タイピング毎の re-render を抑制 |

## 多角的チェック観点（4 条件）

| 条件 | 確認内容 | 結果 |
| --- | --- | --- |
| 矛盾なし | enum 値が apps/api / apps/web / shared で同一 | `parsePublicMemberQuery` と `members-search.ts` で `0_to_1` / `1_to_10` / `10_to_100` / `member` / `non_member` / `academy` 一致 |
| 漏れなし | 6 query parameter 全てに parse・default・bind パスがある | q / zone / status / tag / sort / density すべて parser に実装済み |
| 整合性 | API response の `appliedQuery.density` が UI 描画密度と一致 | `toPublicMemberListView` がエコーする設計 |
| 依存関係整合 | `apps/web` → API → D1 の順で公開境界を越えない | `fetchPublic` 経由のみ（不変条件 #5） |

## 次 Phase への引き渡し

Phase 3 へ以下を渡す:

- API / repo / use-case / view / page / filter UI の関数シグネチャ案
- D1 クエリ設計（base WHERE / q / zone / status / tag / sort / pagination）
- URL 同期方針（router.replace 採用）
- `sort=name` の氏名順挙動と要レビュー事項
- 変更対象ファイル一覧（apps/api / apps/web / shared）

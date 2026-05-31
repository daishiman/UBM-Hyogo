# Phase 1: 要件定義

## 目的

公開 members list（`GET /public/members`）で `expand=tags` を指定したとき、全 member の tags を
N+1 を起こさず `member_id IN (...)` の単一 query で一括取得して応答に含める。`expand` 未指定時は
既存挙動（tags なし・応答形状そのまま）を完全維持する。

## 実装区分

実装仕様書（コード変更を伴う / NON_VISUAL）。判定根拠は index.md「実装区分の判定根拠」を参照。

## 受け入れ条件（AC）

| ID   | 条件                                                                                                |
| ---- | -------------------------------------------------------------------------------------------------- |
| AC-1 | `/public/members?expand=tags` で全 member の tags（code / label / category）が返る                 |
| AC-2 | tags 取得の D1 query が member 件数に比例しない（`member_id IN (...)` の 1 query のみ）             |
| AC-3 | `expand` を指定しない場合は応答 item に `tags` が含まれない（tags batch query 0 回）               |
| AC-4 | leak 防御 / visibility filter（`is_deleted=0` / `public_consent='consented'` / `publish_state='public'` / alias 除外）が維持される |
| AC-5 | contract / use-case test で N+1 リグレッション（tags batch query が件数比例に戻る退行）を検知できる |

## 現状コード anchor（実コード verbatim 確認済み 2026-05-31）

| 種別                  | パス                                                          | 現状の事実                                                                                                       |
| --------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| query parser          | `apps/api/src/_shared/search-query-parser.ts`                | `RawZ`(zod) + `ParsedPublicMemberQuery` type。フィールドは `q / zone / status / tags / sort / density / page / limit`。`expand` 無し（追加対象）。不正値は zod `.catch()` / `safeParse` で default fallback |
| use-case（組み立て）   | `apps/api/src/use-cases/public/list-public-members.ts`       | `listPublicMembersUseCase(query: ParsedPublicMemberQuery, deps)`。`Promise.all` で list/count/topTags。member 毎に `listFieldsByResponseId(ctx, m.current_response_id)`（fields は既に N+1・別系統）。item を `PublicMemberListItemSource[]` に push し `toPublicMemberListView` で変換。tags は未取得（配線対象） |
| batch helper（既存）   | `apps/api/src/repository/memberTags.ts` `listTagsByMemberIds` | **実装済み**。`listTagsByMemberIds(c: DbCtx, mids: MemberId[]): Promise<MemberTagWithDefinition[]>`。`WHERE mt.member_id IN (${placeholders}) AND td.active = 1`。**返り値はフラット配列**（Map ではない）。`mids.length === 0` で `[]` 早期 return。要素は `{ member_id, tag_id, code, label, category, ... active }` |
| member 行型            | `apps/api/src/repository/publicMembers.ts` `PublicMemberRow` | `{ member_id, current_response_id, last_submitted_at }` |
| visibility filter      | `apps/api/src/repository/publicMembers.ts` `buildBaseFromWhere` | leak 防御の正本。`s.public_consent='consented' AND s.publish_state='public' AND s.is_deleted=0 AND mi.member_id NOT IN (SELECT source_member_id FROM identity_aliases)`。tags 取得対象 memberId は本 filter 通過後の `listPublicMembers` 結果集合 |
| view-model            | `apps/api/src/view-models/public/public-member-list-view.ts` | `PublicMemberListItemSource`（`memberId/fullName/nickname/occupation/location/ubmZone/ubmMembershipType`、tags 無し＝追加対象）。`toPublicMemberListView` は `stripForbidden`（responseEmail/rulesConsent/adminNotes 除去）後 `PublicMemberListResponseZ.parse` で fail-close |
| shared zod schema     | `packages/shared/src/zod/viewmodel.ts`                       | `PublicMemberListItemZ = z.object({...})`（**非 strict**・tags 追加可）。親 `PublicMemberListViewZ` は `.strict()`（items 要素ではなくトップレベル）。`appliedQuery` も `.strict()` で `{q,zone,status,tags,sort,density}` のみ → **expand を appliedQuery に含めてはならない** |
| shared 型             | `packages/shared/src/types/viewmodel/index.ts`              | `PublicMemberListItem` interface（tags 無し＝`tags?` 追加対象）。`memberId: MemberId` |
| route handler         | `apps/api/src/routes/public/members.ts`                      | searchParams を全取り込み `raw: Record<string, string|string[]>` → `parsePublicMemberQuery(raw)` → use-case。`expand` も raw に自動で入るため route 変更は基本不要 |
| contract spec         | `apps/api/src/routes/public/index.contract.spec.ts`         | `createPublicD1Mock`（`use-cases/public/__tests__/helpers/public-d1.ts`）利用。**query 計数 spy 機構なし**（追加方針は Phase 4 で確定）。N+1 検知テスト追加対象 |
| use-case unit spec    | `apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts` | use-case 直叩き spec。tags batch query 回数の assert はここが第一候補 |
| D1 mock helper        | `apps/api/src/use-cases/public/__tests__/helpers/public-d1.ts` | `createPublicD1Mock`。member list の tags batch（`member_id IN`）に応答する fixture / spy をサポートするか Phase 4 で確認・必要なら拡張 |

## 命名規則（既存分析）

- TypeScript identifier: camelCase（`listTagsByMemberIds` / `parsePublicMemberQuery` / `listPublicMembersUseCase`）
- query param: lowerCase（`q` / `zone` / `status` / `tag`(repeated) / `sort` / `density` / `page` / `limit`）→ 新規 `expand` も lowerCase
- zod schema 命名: `<Name>Z` suffix（`PublicMemberListItemZ` / `SortZ`）→ 新規 tag schema は `PublicMemberTagZ`
- D1 column: snake_case（`member_id` / `public_consent` / `publish_state`）

## expand パラメータ仕様

- 形式: カンマ区切り、または repeated param（既存 `tag`/`tags` の取り込み規約に合わせ string | string[] 両対応）。例 `expand=tags`、将来拡張に備え `expand=tags,xxx` も受理。
- whitelist: 現時点で受理する値は `"tags"` のみ。未知の値は黙って除外（throw しない・既存 parser の `.catch()` 防御的方針に整合）。
- パース結果: `ParsedPublicMemberQuery.expand: ("tags")[]`（**常に配列**、デフォルト `[]`）。`includes("tags")` で opt-in 判定。
- **`appliedQuery` には含めない**（`appliedQuery` は `.strict()` で既存6キー固定。expand を足すと strict 違反になる）。

## tags batch の groupBy 設計（実 helper 仕様に整合）

`listTagsByMemberIds` は **フラット配列** を返すため、use-case 側で memberId キーの Map に groupBy してから
各 member item に引き当てる:

```
const tagRows = await listTagsByMemberIds(ctx, memberIds); // 1 query, MemberTagWithDefinition[]
const byMember = new Map<string, { code: string; label: string; category: string }[]>();
for (const r of tagRows) {
  const arr = byMember.get(r.member_id) ?? [];
  arr.push({ code: r.code, label: r.label, category: r.category });
  byMember.set(r.member_id, arr);
}
// item へ: tags: byMember.get(m.member_id) ?? []
```

## スコープ

### 含む

- `expand` query param のパース（`search-query-parser.ts` の `RawZ` + `ParsedPublicMemberQuery` + parse 本体）
- `expand=tags` 指定時に `listTagsByMemberIds` を 1 回呼び、フラット配列を memberId で groupBy して引き当て（`list-public-members.ts`）
- 応答 schema の tags 拡張（`packages/shared` の `PublicMemberTagZ` 新規 + `PublicMemberListItemZ.tags` optional + 型 `PublicMemberListItem.tags?`）
- view-model の `PublicMemberListItemSource.tags?` 追加（`stripForbidden` は tags 素通し）
- contract / use-case test による N+1 リグレッションガード

### 含まない（スコープ外）

- tags 表示の web UI（`apps/web`）— 受け入れ条件外。issue #1006 等の別レーン
- member fields 取得の N+1 解消（`listFieldsByResponseId` ループ）— 別系統。Phase 12 で未タスク候補として記録
- tag 編集系の変更（不変条件 #13）
- D1 schema 変更 / migration（member_tags / tag_definitions テーブルは既存）

## 不変条件

- invariant #1 / #4 / #5（index.md 参照）
- 公開 leak 防御: tags 取得対象 memberId は必ず `buildBaseFromWhere`（visibility filter）通過後の `listPublicMembers` 結果集合に限定する。helper は memberId 集合に対してのみ JOIN するため非公開 member の tags は leak しない

## CONST_007 スコープ充足

本タスクは API 1 サイクルで AC-1〜AC-5 をすべて達成できる。web UI 表示は受け入れ条件に含まれず、
別 issue（#1006 等）の射程のためスコープ外とする（先送りではなく責務分離）。

## 参照

- `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md`
- `.claude/skills/aiworkflow-requirements/references/error-handling.md`
- `docs/30-workflows/unassigned-task/task-04a-followup-005-tags-bulk-fetch-n-plus-1-prevention.md`

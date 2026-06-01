# Phase 1: 要件定義

> 正本は `outputs/phase-1/requirements.md`。本ファイルは root index からの導線兼サマリ。

## 目的

`/public/members?expand=tags` で全 member の tags を N+1 なしの `member_id IN (...)` 単一 query で
取得し応答に含める。`expand` 未指定時は既存挙動（tags なし）を維持する。

## 受け入れ条件（AC）

| ID   | 条件                                                                          |
| ---- | ----------------------------------------------------------------------------- |
| AC-1 | `/public/members?expand=tags` で全 member の tags（code/label/category）が返る |
| AC-2 | tags 取得が `member_id IN (...)` の 1 query のみ（件数非依存）                 |
| AC-3 | `expand` 未指定で応答 item に `tags` が含まれない（tags batch query 0 回）     |
| AC-4 | visibility filter（is_deleted=0 / public_consent / publish_state / alias除外）が維持される |
| AC-5 | contract / use-case test で N+1 リグレッションを検知できる                     |

## 実装区分

実装仕様書（NON_VISUAL）。詳細・現状コード anchor（実コード verbatim 確認済み）・命名規則・
expand 仕様・tags batch の groupBy 設計・スコープは `outputs/phase-1/requirements.md` を参照。

> 実コード要点: `listTagsByMemberIds`（`apps/api/src/repository/memberTags.ts`）は **フラット配列**
> （`MemberTagWithDefinition[]`・Map ではない）を返すため use-case 層で memberId groupBy が必要。
> query フィールドは `q`/`limit`（`search`/`perPage` ではない）。contract spec は
> `apps/api/src/routes/public/index.contract.spec.ts`。`expand` は `appliedQuery`（`.strict()`）に含めない。

## 不変条件

- invariant #1 / #4 / #5
- 公開 leak 防御: tags 取得対象は visibility filter 通過後の `listPublicMembers` 結果 memberId 集合に限定

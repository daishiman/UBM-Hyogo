# Phase 2: アーキテクチャ

## レイヤ構成

```
apps/web/app/(public)/members/[id]/page.tsx        ← Server Component (fetch + adapter 呼出)
        ↓
apps/web/src/lib/adapters/member-detail.ts         ← pure adapter (新規)
        ↓
apps/web/src/components/public/MemberDetailSections.tsx  ← presentational (filter ロジック撤去)
apps/web/src/components/public/MemberActivity.tsx        ← 既存
apps/web/src/components/public/MemberLinks.tsx           ← 既存
```

## adapter 責務

| 責務 | 内容 |
|------|------|
| 1. visibility 二重防御 | 全 section の field のうち `visibility !== "public"` を最初に除外し、`MemberLinks` / `MemberActivity` にも filtered `allSections` を渡す |
| 2. activity 分離 | visibility filter 済み `allSections` から `key === "activity"` を除外し `detailSections` として返す |
| 3. unknown kind silent skip | `FieldKindZ` enum 外（runtime parse 後の defensive）および adapter として明示的に未知 `kind` を skip |
| 4. url kind 分離 | 既存 `MemberDetailSections` の `kind !== "url"` 除外責務を adapter に移管 |
| 5. 空 section 除去 | filter 後 fields が 0 の section は除外 |

## データフロー不変条件

- adapter は pure function（同一入力 → 同一出力、副作用なし）。
- adapter は throw しない（zod parse は呼出側 = `fetchPublicOrNotFound` が担当）。
- adapter は API shape を mutate せず、`allSections` も public visibility filter 済みの immutable transform とする。

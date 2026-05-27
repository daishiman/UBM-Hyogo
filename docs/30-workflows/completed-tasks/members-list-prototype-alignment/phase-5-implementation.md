# Phase 5 — 実装

## 1. 目的

`/members` を current API contract の範囲で prototype list density に近づける。API、D1 schema、Auth.js、Google Form schema は変更しない。

## 2. 実装内容

| ID | 対象 | 実装 |
| --- | --- | --- |
| T-5.1 | `apps/web/app/(public)/members/page.tsx` | `density="list"` でも `MemberGrid` を使い、`MemberTable` route branch を撤去 |
| T-5.2 | `MemberGrid.tsx` | `Density` 型に `list` を許可し、list header (`data-role="list-head"`) を描画 |
| T-5.3 | `MemberCard.tsx` | list density を avatar / identity / zone+status / location / chevron の 5 col row に分岐 |
| T-5.4 | `MemberCard.tsx` | comfy/dense card に zone chip、occupation/location icon meta、status chip-row を追加 |
| T-5.5 | `TagPicker.client.tsx` / `MemberFilters.client.tsx` | heading slot を追加し「タグで絞り込み」を表示 |
| T-5.6 | `EmptyState.tsx` | `variant?: "default" | "compact"` と `data-variant` を追加 |
| T-5.7 | `Icon.tsx` / `icons.ts` | `briefcase` / `map-pin` / `chevron-right` を追加 |
| T-5.8 | `legacy-public.css` | member grid list, card list row, chip, compact empty state の CSS を追加 |

## 3. Contract Boundary

`PublicMemberListItem` にない `businessOverview` と list item `tags` は追加しない。表示に使う字段は `fullName` / `nickname` / `occupation` / `location` / `ubmZone` / `ubmMembershipType` のみ。

## 4. 完了確認

```bash
pnpm --filter @ubm-hyogo/web typecheck
pnpm --filter @ubm-hyogo/web test -- MemberCard MemberGrid MemberFilters EmptyState
rg -n "from .*MemberTable|import .*MemberTable" apps/web/app apps/web/src
```

`MemberTable` は legacy 互換のため残置するが、`/members` route からは参照しない。

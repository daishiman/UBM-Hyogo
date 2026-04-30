# Phase 8 成果物 — DRY 化

## 概要

4 ルート間で重複し得る fetch / URL helper / EmptyState / error / 404 を共通化。命名と path を spec 用語に揃える。

## Before / After（fetcher）

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| fetch helper | 各 page で `fetch(...)` 直書き | `apps/web/src/lib/fetch/public.ts` の `fetchPublic<T>(path, init?)` | DRY、1 箇所で revalidate 制御 |
| 404 専用 fetch | 各 page で status 判定 | `fetchPublicOrNotFound<T>` + `FetchPublicNotFoundError` | エラー通信の一元化 |
| URL builder | `?q=...&zone=...` 文字列結合 | `toApiQuery(search): URLSearchParams` | type-safe |
| URL parser | `new URLSearchParams` 散在 | `parseSearchParams(searchParams)` + zod | 不正値 fallback (AC-6) |

## Before / After（命名）

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| component | `MembersList` / `MemberList` 揺れ | `MemberList`（複数）, `MemberCard`（個） | spec 用語一致 |
| Filter | `Filter` / `FilterBar` | `MembersFilterBar`（route-local + spec 用語） | 09-ui-ux.md |
| 詳細ページ container | `MemberPage` / `ProfilePage` | `MemberDetailPage` (page 関数名) | URL 一致 |
| 検索 props | `filter` / `query` | `search`（zod 型 `MembersSearch`） | 統一 |
| fetcher 引数 | `revalidate` 文字列直接 | `{ revalidate: number }` | 型 |

## Before / After（path）

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| URL helper | `apps/web/utils/url.ts` | `apps/web/src/lib/url/members-search.ts` | 役割明示 |
| fetch helper | `apps/web/utils/api.ts` | `apps/web/src/lib/fetch/public.ts` | layer 名 |
| Filter Client | `apps/web/components/Filter.tsx` | `apps/web/app/(public)/members/_components/MembersFilterBar.client.tsx` | route-local |
| Empty | route ごと別 | `apps/web/src/components/feedback/EmptyState.tsx` | 再利用 |

## Before / After（共通 component）

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| EmptyState | route ごと別 | `apps/web/src/components/feedback/EmptyState.tsx` | 再利用 |
| ErrorBoundary | 各 page 内 | `apps/web/app/error.tsx` | App Router 標準 |
| 404 | `notFound` 各所 | `apps/web/app/not-found.tsx` + `notFound()` | 統一 |
| 公開層共通 | バラバラ | `apps/web/src/components/public/{Hero,StatCard,MemberCard,Timeline,ProfileHero,FormPreviewSections}.tsx` | 名前空間整理 |

## spec 用語確認

| 用語 | 採用 | 不採用 |
| --- | --- | --- |
| zone | `0_to_1 / 1_to_10 / 10_to_100` | - |
| status | `member / non_member / academy` | - |
| density | `comfy / dense / list` | `comfortable` `compact` |
| sort | `recent / name` | - |

## 不変条件への対応

- #1: zone / status enum 値を spec stableKey と一致
- #5: fetcher に domain 直書きなし、`PUBLIC_API_BASE_URL` 経由
- #6: 共通 fetcher 内で `window.UBM` 参照ゼロ
- #8: URL helper の入口は zod parse（localStorage 経路なし）

## サブタスク

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | fetcher Before/After | completed |
| 2 | 命名 Before/After | completed |
| 3 | path Before/After | completed |
| 4 | 共通 component | completed |
| 5 | spec 用語確認 | completed |

## 完了条件

- [x] 4 種 Before / After が表化
- [x] spec 用語と一致を確認
- [x] 共通 component の path 確定

# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | public-landing-directory-and-registration-pages |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 |
| 作成日 | 2026-04-26 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | pending |

## 目的

4 ルート間の重複を Before / After 表で整理。fetcher / URL helper / EmptyState / error.tsx を共通化する。命名と path を spec 用語に揃える。

## 実行タスク

1. 共通 fetcher
2. URL helper（query 構築 / 解析）
3. EmptyState / error.tsx の共通化
4. component 命名統一
5. spec 用語との一致確認

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/page-tree.md | 構造 |
| 必須 | outputs/phase-02/data-fetching.md | fetch 設計 |
| 参考 | docs/00-getting-started-manual/specs/09-ui-ux.md | UI primitives |

## 実行手順

### ステップ 1: Before / After（fetcher）

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| fetch helper | `fetch(...)` 各 page で生書き | `apps/web/lib/fetch/public.ts` の `fetchPublic<T>(path, init?)` | DRY |
| URL builder | `?q=...&zone=...` 文字列結合 | `apps/web/lib/url/members-search.ts` の `toApiQuery(search)` | type-safe |
| URL parser | `new URLSearchParams` 散在 | `membersSearchSchema.parse(searchParams)` | zod 統一 |

### ステップ 2: Before / After（命名）

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| component | `MembersList` / `MemberList` 揺れ | `MemberList`（単 + 列）, `MemberCard`（個） | spec 用語一致 |
| Filter Bar | `Filter` / `FilterBar` | `FilterBar`（spec 用語） | 09-ui-ux.md |
| 詳細ページ container | `MemberPage` / `ProfilePage` | `MemberDetailPage` | URL 一致 |
| 検索 props | `filter` / `query` | `search`（zod 型 `MembersSearch`） | 統一 |

### ステップ 3: Before / After（path）

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| URL helper | `apps/web/utils/url.ts` | `apps/web/lib/url/members-search.ts` | 役割明示 |
| fetch helper | `apps/web/utils/api.ts` | `apps/web/lib/fetch/public.ts` | layer 名 |
| Filter Client | `apps/web/components/Filter.tsx` | `apps/web/app/members/_components/MembersFilterBar.client.tsx` | route-local |

### ステップ 4: Before / After（共通 component）

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| EmptyState | route ごと別 | `apps/web/components/feedback/EmptyState.tsx` | 再利用 |
| ErrorBoundary | 各 page 内 | `apps/web/app/error.tsx` + route 別 `error.tsx` | App Router 標準 |
| 404 | `notFound` 各所 | `apps/web/app/not-found.tsx` + route 別 | 統一 |

### ステップ 5: spec 用語確認

| 用語 | 採用 |
| --- | --- |
| zone | `0_to_1 / 1_to_10 / 10_to_100`（01-api-schema.md） |
| status | `member / non_member / academy` |
| density | `comfy / dense / list`（`comfortable` `compact` 不採用） |
| sort | `recent / name` |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | typecheck / lint pass |
| 08a | path 一致を契約 test で確認 |

## 多角的チェック観点

- 不変条件 #1: zone / status の値が stableKey と整合
- 不変条件 #5: fetcher が apps/api 経由のみ（domain 直書きなし）
- 不変条件 #6: 共通 fetcher 内で `window.UBM` 参照なし
- 不変条件 #8: URL helper の入口は zod parse、localStorage 経路なし

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | fetcher Before / After | 8 | pending | 3 件 |
| 2 | 命名 Before / After | 8 | pending | 4 件 |
| 3 | path Before / After | 8 | pending | 3 件 |
| 4 | 共通 component | 8 | pending | EmptyState / error / 404 |
| 5 | spec 用語確認 | 8 | pending | 4 種 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | Before / After |
| メタ | artifacts.json | phase 8 status |

## 完了条件

- [ ] 4 種 Before / After が表化
- [ ] spec 用語と一致を確認
- [ ] 共通 component の path 確定

## タスク100%実行確認【必須】

- 全 5 サブタスクが completed
- outputs/phase-08/main.md 配置
- 不変条件 #1, #5, #6, #8 への対応が明記
- 次 Phase へ命名規約を引継ぎ

## 次 Phase

- 次: 9 (品質保証)
- 引き継ぎ事項: 統一名称を typecheck / lint の入力に
- ブロック条件: 命名揺れが残るなら進まない

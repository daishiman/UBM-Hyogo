# Phase 6: Web 実装（TagPicker / Mobile レイアウト）— 実装サマリ

## 実装変更（実コード）

### 新規 component

| ファイル | 役割 |
|---------|------|
| `apps/web/src/components/public/TagPicker.client.tsx` | tag 候補 chip picker。`role="switch"` + `aria-checked` + `aria-disabled` で上限到達状態を表現し、`aria-live="polite"` で hint を提示 |
| `apps/web/src/components/public/SelectedTagsBar.client.tsx` | 選択済み tag を `data-role="active-tags"` リストとして表示し、× / clear-all で削除 |
| `apps/web/src/components/public/FiltersSummaryMobile.client.tsx` | mobile summary 行。`aria-expanded` 切替で `data-expanded` を更新 |

### 既存改修

| ファイル | 変更内容 |
|---------|---------|
| `apps/web/src/components/public/MemberFilters.client.tsx` | `topTags` prop 追加、`expanded` state 管理、`onTagToggle` を 5 件上限で no-op 化、`clear-all` で `router.replace('/members')`、新 component の組み込み |
| `apps/web/app/(public)/members/page.tsx` | `<MemberFilters initial={search} topTags={list.topTags} />` で API 由来値を引き渡し |
| `apps/web/src/styles/globals.css` | `@media (max-width: 640px)` で `[data-component="member-filters"][data-expanded="false"] [data-role="filters-body"]` を `display:none`。OKLch トークンのみ使用 |

### テスト

| ファイル | 観点 |
|---------|------|
| `apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx` | topTags chip / 上限到達 disabled / clear-all / mobile summary 切替 を担保 |
| `apps/web/src/components/public/__tests__/TagPicker.client.spec.tsx` | chip render / onToggle / aria-disabled / hint / empty 非描画 |
| `apps/web/src/components/public/__tests__/SelectedTagsBar.client.spec.tsx` | empty 非描画 / × onRemove / clear-all |

## ローカル検証結果

- `mise exec -- pnpm typecheck` → green
- `mise exec -- pnpm lint` → green（OKLch トークン違反 0、dependency-cruiser pass）
- `mise exec -- pnpm --filter @ubm-hyogo/web test` → 106 files / 724 tests pass

## URL 不変条件

- `?tag=...&tag=...` repeated query 維持（`URLSearchParams.append`）
- `expanded` は React state のみで URL に乗せない（不変条件 #8）
- tag 上限 (`MEMBERS_SEARCH_LIMITS.TAG_LIMIT=5`) 超過 toggle は no-op

## DoD

- [x] `pnpm typecheck` green
- [x] `pnpm lint` green
- [x] Vitest 全件 green
- [x] page.tsx で topTags を渡している
- [x] 3 新規 component 作成
- [ ] Playwright mobile spec（後続: Phase 11 にて手動実行 + screenshot 取得）

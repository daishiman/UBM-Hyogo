# Phase 6: Web 実装（TagPicker / Mobile レイアウト）

[実装区分: 実装仕様書]

## メタ情報

| Phase | 6 |
| 前提 | Phase 5 完了（API green） |
| 後続 | Phase 7 |

## 目的

`MemberFilters` を Phase 3 の component tree に従って改修し、Phase 4 の Vitest / Playwright を green にする。

## 変更対象ファイル

| ファイル | 変更種別 |
|---------|---------|
| `apps/web/src/components/public/TagPicker.client.tsx` | 新規 |
| `apps/web/src/components/public/SelectedTagsBar.client.tsx` | 新規 |
| `apps/web/src/components/public/FiltersSummaryMobile.client.tsx` | 新規 |
| `apps/web/src/components/public/MemberFilters.client.tsx` | 編集 |
| `apps/web/app/(public)/members/page.tsx` | 編集 |
| `apps/web/src/styles/tokens.css` または該当 CSS | 編集（mobile media query 追加） |

## 実装手順

1. **TagPicker.client.tsx 新規**
   - Phase 3 の `TagPickerProps` を実装
   - チップは `<button role="switch" aria-checked={selected.includes(code)}>` を使用
   - `selected.length >= max && !selected.includes(code)` で `aria-disabled="true"` + visual disable
   - 上限到達時、`<p data-role="tag-limit-hint" aria-live="polite">これ以上選択できません</p>` を表示
   - CSS は OKLch トークンを参照（`bg-[#xxx]` 等の HEX 直書き禁止）

2. **SelectedTagsBar.client.tsx 新規**
   - `selected.map(code => <button onClick={() => onRemove(code)}>#{code} ×</button>)`
   - selected.length > 0 のとき `clear-all` button を表示

3. **FiltersSummaryMobile.client.tsx 新規**
   - mobile のみ visible（CSS `@media (max-width: 640px)` で表示切替）
   - 表示文字列: `絞り込み中: ${q || '—'} / zone:${zone} / status:${status} / tag×${tagCount}`
   - `expanded=false` 時、本体 `MemberFilters` の inputs 群は CSS で hidden

4. **MemberFilters.client.tsx 編集**
   - `topTags` prop 追加
   - `useState<boolean>(false)` で `expanded` 管理（**URL に乗せない**）
   - 既存の `onTagToggle` を `TagPicker` の `onToggle` に流用（5 件超過時は no-op）
   - clear-all は `router.replace('/members')`
   - 既存 `<ul data-role="active-tags">` は `SelectedTagsBar` に置換

5. **`page.tsx` 編集**
   ```tsx
   <MemberFilters initial={search} topTags={list.topTags} />
   ```

6. **CSS（mobile collapse）**
   - `tokens.css` に新規変数を追加しない方針。既存 spacing/colors を使い `@media (max-width: 640px)` で `[data-component="member-filters"][data-expanded="false"]` 配下の inputs を `display: none` する

## 入出力・副作用

- React state は `expanded` のみ。tag selection は URL を正本（不変条件 #8）
- router.replace で URL 同期、内部 state は持たない
- SSR 初期: mobile 判定は CSS のみ → hydration mismatch 回避

## ローカル実行コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test -- MemberFilters TagPicker SelectedTagsBar
mise exec -- pnpm --filter @ubm-hyogo/web dev   # 手動確認
# 別ターミナル
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test members-filter-mobile
```

## 完了条件（DoD）

- [ ] `pnpm typecheck` green
- [ ] `pnpm lint` green（OKLch トークン違反 0）
- [ ] Vitest 全件 green
- [ ] Playwright `members-filter-mobile.spec.ts` green
- [ ] URL repeated `?tag=...&tag=...` が維持される
- [ ] mobile / desktop どちらの viewport でも reload で状態復元

## タスク100%実行確認【必須】

- [ ] 3 新規 component が作成された
- [ ] MemberFilters 改修が完了
- [ ] page.tsx で topTags を渡している

## 次Phase

Phase 7 へ。

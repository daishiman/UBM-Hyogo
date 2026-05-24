# Phase 11: Manual Test / Screenshot Evidence

## ステータス

- code 実装 (Phase 5 全件): 完了
- screenshot 取得: **present**

## 取得結果

local Playwright smoke `apps/web/playwright/tests/members-prototype-alignment.spec.ts` で、mock public API を使って `outputs/phase-11/screenshots/` に EV-1..EV-6 を保存した。

staging deploy 後の production-equivalent visual evidence は Phase 13 以降の user-gated 境界として残す。

## 撮影対象（DoD 上の要件）

| viewport | density | 期待差分 |
|---|---|---|
| desktop (1280) | comfy | page-head eyebrow + h1、Segmented、3 列カード、filter pill 行 |
| desktop (1280) | dense | 4 列カード（minmax 260px） |
| desktop (1280) | list | テーブル grid 5 列、active-tags 行 |
| mobile (390) | comfy | filter-grid が 1fr 化、page-head 縦積み |
| mobile (390) | list | テーブルが横スクロール可能 |

## 自動検証で代替済みの項目

- DOM contract: 全 8 `data-component` の rg ヒット確認済み
- 単体テスト: `MemberFilters` / `DensityToggle` / `MemberCard` / `MemberGrid` / `MemberTable` / `PublicHeader` / `PublicFooter` 全 pass
- token 整合: `pnpm verify:tokens` ✓ (88 tracked)
- Playwright: `members-prototype-alignment.spec.ts` ✓ (1 passed, EV-1..EV-6 captured)

# 実装サマリ — members-page-prototype-alignment

## 完了 Phase

| Phase | 状態 | 備考 |
|---|---|---|
| 1〜4 (設計・テスト計画) | 既存仕様書を踏襲 | 変更なし |
| 5 (実装) | ✅ 完了 | 下記「変更ファイル」参照 |
| 6 (テスト追加) | ✅ 完了 | DensityToggle / MemberFilters / MemberGrid / MemberCard spec 更新、Playwright smoke 追加 |
| 7 (coverage) | ✅ 完了 | 874 tests pass / 1 skipped |
| 8 (refactor) | スコープ内なし | — |
| 9 (QA) | ✅ 完了 | typecheck / lint / verify:tokens / build 全 pass |
| 10 (final review) | ✅ 完了 | DoD 全項目 OK |
| 11 (manual test) | ✅ 完了 | local Playwright で 6 screenshot + report を `outputs/phase-11/` に保存 |
| 12 (docs) | ✅ 完了 | 本ドキュメント |

## 変更ファイル

### 実装変更 (apps/web)

| パス | 種別 | 概要 |
|---|---|---|
| `apps/web/src/components/ui/Segmented.tsx` | edit | `ariaLabel` / `data-*` rest props 対応、`role="radiogroup"` を root へ |
| `apps/web/src/components/public/DensityToggle.client.tsx` | rewrite | `Segmented` primitive ベースへ書換、`usePathname` 利用、`router.replace(..., { scroll: false })` |
| `apps/web/src/components/public/MemberFilters.client.tsx` | edit | `<form role="search">` + `data-role="filter-grid"` + `data-role="clear"` + DensityToggle 描画責務を `page.tsx` へ移譲 |
| `apps/web/src/components/public/MemberCard.tsx` | edit | `data-role="head"`/`identity`/`meta`/`zone`/`status` の階層構造に再編 |
| `apps/web/src/components/public/PublicHeader.tsx` | edit | optional `currentPath` prop / `aria-current="page"` ロジック |
| `apps/web/src/components/feedback/EmptyState.tsx` | edit | `data-role="icon"` 追加 |
| `apps/web/app/(public)/members/page.tsx` | edit | page-head (`eyebrow`/`h1`/`lead`) と DensityToggle を h2 hierarchy で配置 |
| `apps/web/src/styles/legacy-public.css` | append | `@layer components` 末尾に prototype 準拠 selector 群 (~300 行) を追加 |

### テスト変更

| パス | 種別 | 概要 |
|---|---|---|
| `apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx` | rewrite | Segmented (button role=radio) 前提に書換、`usePathname` mock 追加 |
| `apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx` | edit | DensityToggle 非描画前提、`filter-grid` / `clear` button assertion 追加 |
| `apps/web/src/components/public/__tests__/MemberGrid.spec.tsx` | edit | MemberCard 内部 `<li>` の影響を避け、直接子要素数で assert |
| `apps/web/src/components/public/__tests__/MemberCard.spec.tsx` | add | density hooks と list density 表示差分を追加検証 |
| `apps/web/playwright/tests/members-prototype-alignment.spec.ts` | add | `/members` 主要 selector と Phase 11 screenshot 6 件を取得 |

## DoD 達成状況

| 項目 | 結果 |
|---|---|
| `pnpm typecheck` | ✅ all packages pass |
| `pnpm lint` | ✅ pass (boundary / dep / stable-key 全て clean) |
| `pnpm --filter @ubm-hyogo/web build` | ✅ pass (env 注入時) |
| `pnpm --filter @ubm-hyogo/web test --run` | ✅ 874 tests pass / 1 skipped |
| `pnpm verify:tokens` | ✅ 88 tracked, drift 0 |
| `rg "bg-\[#"` で新規 HEX 0 件 | ✅ 0 hits in apps/web |
| `data-component` 8 種すべて存在 | ✅ public-header / footer / density-toggle / member-filters / member-table / member-card / member-grid / empty-state 全部 hit |
| screenshot evidence | ✅ EV-1..EV-6 PNG present + Playwright report present |

## 不変条件遵守

- ✅ API endpoint surface 無変更 (`apps/api` 触らず)
- ✅ D1 直接アクセスなし
- ✅ HEX 直書き / `bg-[#xxx]` 新規 0 件
- ✅ 新規 spec は `*.spec.tsx` のみ
- ✅ 新規 primitive 追加なし (既存 Segmented / FormField / Avatar 流用)

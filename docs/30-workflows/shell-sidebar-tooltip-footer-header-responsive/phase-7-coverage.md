---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 7
phase_name: カバレッジ
created_at: 2026-06-03
workflow: docs/30-workflows/shell-sidebar-tooltip-footer-header-responsive/
---

# Phase 7: カバレッジ

## 7.1 カバレッジ目標の方針（変更ブロック限定）

本タスクのカバレッジ対象は **変更／新規したブロックに限定**する。広域な file 全体や `apps/web/src/**` 一括指定はしない（既存 shell の未変更ロジックを巻き込まないため）。レーン B（フッター CSS）/ レーン C（mobile-bar class）は CSS / class のみの変更で JS branch を持たないため、unit カバレッジの対象外とし **Phase 11 visual + 手動スクロール確認**で担保する（honest scope）。

| レーン | 対象 | カバレッジ層 |
|--------|------|-------------|
| A | `SidebarTooltip.tsx`（新規ロジック）+ 各コントロールの collapsed ラップ分岐 | RTL unit（line / branch） |
| B | `legacy-public.css` `[data-component="public-footer"]` の sticky 化 | unit 対象外（純 CSS）→ Phase 11 visual `public-footer-sticky-bottom.png` |
| C | `SidebarShell.tsx` mobile-bar の `sticky top-0 z-30` class | class assert（DOM 契約）+ Phase 11 visual `mobile-header-sticky.png` |

## 7.2 レーン A — `SidebarTooltip.tsx` の branch / line 網羅

`SidebarTooltip` は新規ロジック密度の中心であり、ここで branch を carve する。

| branch | 条件 | 検証 spec / ケース |
|--------|------|---------------------|
| B-1 | `collapsed === false` → children パススルー（wrap / bubble なし） | `SidebarTooltip.spec`：collapsed=false render で `data-shell-block="tooltip"` 不在・children が DOM 直返し（AC-A2） |
| B-2 | `collapsed === true` → wrap + `role="tooltip"` bubble 描画 | `SidebarTooltip.spec`：collapsed=true render で `role="tooltip"` 要素が存在し textContent=label（AC-A1） |
| B-3 | trigger に既存 `aria-describedby` **無し** → tooltip `id` 単独注入 | `SidebarTooltip.spec`：describedby 無し children を渡し、`aria-describedby === tooltipId`（AC-A3） |
| B-4 | trigger に既存 `aria-describedby` **有り** → 既存 id と tooltip `id` を space 連結 | `SidebarTooltip.spec`：`aria-describedby="foo"` children を渡し、`aria-describedby` が `"foo {tooltipId}"`（連結漏れ防止・`.filter(Boolean).join(" ")` 経路） |

- function カバレッジ: `SidebarTooltip` 本体 1 function を B-1 / B-2 の 2 ケースで full。
- line カバレッジ: `useId()` / `cloneElement` / `.filter(Boolean).join(" ")` / wrap JSX / パススルー return の全行を B-1〜B-4 で踏破。

## 7.3 レーン A — 各コントロールへの適用 branch

`SidebarTooltip` 本体とは別に、各コントロールの「collapsed 時のみラップ」分岐を所有 spec で carve する。

| file | branch | 検証 spec / ケース |
|------|--------|---------------------|
| `SidebarNavItem.tsx` | collapsed 時 wrap / expanded 時 非ラップ（× external / internal 2 経路） | `SidebarNavItem.spec`：collapsed render で `role="tooltip"`=label・`aria-describedby` 配線、expanded render で tooltip 不在（AC-A1 / A2 / A6） |
| `SidebarShell.tsx`（AdminPublicReturn） | collapsed 時 `SidebarTooltip` 化（`title` 属性削除）/ expanded 時 非ラップ | `SidebarShell.spec`：collapsed で tooltip 存在・`title` 属性消失、expanded で tooltip 不在（AC-A5） |
| `SidebarUserMenu.tsx` | collapsed 時 `<summary>` 内に inline `role="tooltip"` bubble / expanded 時 非描画（D-3: wrap せず inline bubble） | `SidebarUserMenu.spec`（既存 or 追記）：collapsed で `role="tooltip"`=「ユーザーメニュー」存在（AC-A5） |
| `SidebarCollapseToggle.tsx` | collapsed 時 wrap / expanded 時 非ラップ | `SidebarCollapseToggle.spec`：collapsed で tooltip 存在=「サイドバーを展開」（AC-A5） |

## 7.4 レーン B / C — unit カバレッジ対象外の明示

- **レーン B**（`legacy-public.css` の `position: sticky; bottom: 0; background: var(--ubm-color-surface-bg)`）は jsdom では sticky 挙動・背景重なりを評価できない（layout を持たない）。→ unit カバレッジ対象外。`AC-B1`（下端固定）/ `AC-B2`（不透明背景）は **Phase 11 Playwright visual `public-footer-sticky-bottom.png` + 手動スクロール確認**で担保。`AC-B2` の宣言存在のみ `legacy-public.css` の grep（`background: var(--ubm-color-surface-bg)`）で補助検証する。
- **レーン C**（mobile-bar の `sticky top-0 z-30`）は class 文字列であり JS branch を持たない。→ unit は class assert（DOM 契約）に限定。実スクロール時の固定挙動は **Phase 11 visual `mobile-header-sticky.png` + 手動確認**で担保。

## 7.5 確認コマンド

```bash
# 変更ブロックの focused 実行（coverage 取得は test:coverage で）
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/shell/__tests__/SidebarTooltip
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/shell/__tests__/SidebarNavItem
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/shell/__tests__/SidebarShell
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/shell/__tests__/SidebarCollapseToggle

# coverage threshold（既存設定を正本）
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage
```

## 7.6 threshold 割れ時の回復ケース

threshold drop が起きた場合、不足しがちな次の branch を補う:

1. **`SidebarTooltip.tsx`**: (a) `collapsed=false` パススルー、(b) `aria-describedby` 既存有無の 2 分岐（B-3 / B-4）。既存 describedby 連結ケースが抜けやすい。
2. **`SidebarNavItem.tsx`**: external（`<a>`）/ internal（`<Link>`）の 2 経路それぞれで collapsed ラップを踏むこと。片方だけだと branch が欠ける。
3. **`SidebarUserMenu.tsx`**: viewer（未ログイン）/ authenticated の avatar trigger で collapsed inline bubble が描画される経路。

## 7.7 完了条件

- 変更ブロック（`SidebarTooltip.tsx` + 4 コントロールの collapsed 分岐）の line / branch が covered。
- pre-existing coverage threshold（lines / branches / functions の 3 lane）を割らない。
- レーン B / C は unit 対象外として Phase 11 visual / 手動確認に委譲することを記録済み。
- `apps/api` のカバレッジに影響なし（差分 0）。

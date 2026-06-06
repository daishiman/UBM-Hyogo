---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 6
phase_name: テスト追加
created_at: 2026-06-03
task_type: implementation
visual_category: VISUAL
implementation_mode: new
workflow: docs/30-workflows/shell-sidebar-tooltip-footer-header-responsive/
---

# Phase 6: テスト追加

Phase 4 の RED を Phase 5 で GREEN にした後、fail-path / 回帰 guard / a11y / カバレッジ補強を追加する。`*.spec.tsx` のみ（`*.test.*` 禁止・I-7）。既存 it ブロックは変更せず **追記** する。

## 6.1 追加 / 補強する spec 一覧

| # | spec path | 種別 | 追加内容 | 主目的 |
|---|-----------|------|----------|--------|
| 1 | `SidebarTooltip.spec.tsx` | 補強 | branch 網羅（collapsed true/false × aria-describedby 既存あり/なし）+ 二重読み上げ回避 assert | カバレッジ + AC-A6 |
| 2 | `SidebarNavItem.spec.tsx` | 補強 | 二重読み上げ回避 / 既存挙動回帰（nav 数・aria-current・sr-only） | AC-A6 / 回帰 |
| 3 | `SidebarShell.spec.tsx` | 補強 | z-index class 階層 assert / 既存 nav 数回帰 / drawer 側 tooltip 非描画 | AC-C2 / 回帰 |
| 4 | `SidebarUserMenu.spec.tsx` | 補強 | details>summary semantics 不変 / popover 既存挙動回帰 | D-3 / 回帰 |
| 5 | `SidebarCollapseToggle.spec.tsx` | 補強 | click 委譲 / aria-label 保持 fail-path | 回帰 |
| 6 | axe（jest-axe） | 新規 it（各 collapsed render に対して） | a11y 違反 0 | AC-A6 |

## 6.2 二重読み上げ回避の assert（AC-A6・最重要 fail-path）

ツールチップ追加で「accessible name が tooltip ラベルで上書きされて二重読み上げになる」退行を防ぐ。**name は trigger 側、description は tooltip 側**という分離を以下で carve する。

### `SidebarTooltip.spec.tsx` 追記

| # | it | expected |
|---|----|----------|
| T7 | "aria-describedby は trigger の既存 name 属性（aria-label / sr-only）を上書きしない" | trigger を `<button aria-label="展開">` で渡し collapsed=true → trigger の `aria-label` が `"展開"` のまま / `aria-describedby` に tooltip id が**加算**される（name と description が別属性） |
| T8 | "collapsed=false → true → false の再レンダリングで aria-describedby が残留しない" | rerender で collapsed=false に戻すと children 直返しとなり `aria-describedby` 注入が消える（描画されない） |

### `SidebarNavItem.spec.tsx` 追記

| # | it | expected |
|---|----|----------|
| N8 | "collapsed でリンクの accessible name は label のまま（tooltip は description）" | `[data-shell-block="nav-item"]` の textContent に sr-only label を含み（name source）、`aria-describedby` は別途 tooltip id を指す。link 要素自体に `aria-label` 上書きが無い |

> jest-axe の `aria-describedby` 参照先存在チェック（dangling reference 0）も §6.5 で担保する。

## 6.3 既存テスト回帰 guard（nav 数 / aria-current / sr-only）

tooltip / sticky 追加が既存 DOM 契約を壊さないことを明示確認する。**既存 it は変更しない**が、追記の describe で回帰を二重に固める。

### `SidebarShell.spec.tsx` 追記（回帰）

| # | it | expected |
|---|----|----------|
| S6 | "viewer/member/admin の nav item 数が tooltip 追加後も維持される" | `renderShell("viewer")`=3 / `("member")`=4 / `("admin")`=14（既存 it と同値・tooltip wrap で nav-item 数が増減しない） |
| S7 | "collapsed で nav-item 数が expanded と同数（tooltip は nav-item を増やさない）" | `renderShell("member", true)` の `[data-shell-block="nav-item"]` が 4 個（wrap は nav-item の外側 span であり count に影響しない） |
| S8 | "drawer ツリー側（expanded 引数）では footer コントロールに tooltip が出ない" | `renderShell("admin", true)` で drawer（`sidebarFooterContent(false)` 経由）配下の `[role="tooltip"]` が aside 側のみで、drawer スコープには現れない（aside と drawer の二重描画で tooltip が aside 限定であることを確認） |

### `SidebarNavItem.spec.tsx` 追記（回帰）

| # | it | expected |
|---|----|----------|
| N9 | "collapsed で sr-only label span が維持される（既存 it 同等を tooltip 追加後に再確認）" | label を含む `<span>` が `sr-only` class を保持 |
| N10 | "collapsed で active item の aria-current=page / data-active=true が維持される" | `[data-shell-block="nav-item"][data-active="true"]` の `aria-current` が `"page"`（N7 を回帰として再掲） |

### `SidebarUserMenu.spec.tsx` 追記（回帰・D-3）

| # | it | expected |
|---|----|----------|
| U6 | "popover（role=menu）の既存 action 描画が collapsed tooltip 追加後も維持される" | `[data-shell-block="user-menu-popover"]` 内の menuitem 数 / signout が既存どおり |
| U7 | "details.firstElementChild が summary のまま（tooltip は summary 内部子で semantics を壊さない）" | `details.firstElementChild?.tagName === "SUMMARY"` / tooltip span は summary の子孫であり details 直下子ではない |

## 6.4 z-index 階層の class assert（AC-C2 / レーン整合）

z-index 階層（drawer 40 > mobile-bar 30 = tooltip CSS 30 > footer 20 = popover 20）のうち、DOM class で観測可能な層を assert する。

### `SidebarShell.spec.tsx` 追記

| # | it | expected |
|---|----|----------|
| S9 | "mobile-bar の z-30 が drawer(z-40) より下・本文より上の階層を表す" | mobile-bar `className` が `z-30` を含み `z-40` / `z-50` を含まない |

### tooltip CSS class（CSS は jsdom 非観測のため grep で補助）

`.ubm-shell-tooltip` の `z-index: 30` / footer `z-index: 20` は CSS 値で jsdom が反映しないため、Phase 9 の手動 grep で確認する:

```bash
grep -nE "z-index: 30" apps/web/src/styles/globals.css          # tooltip
grep -nE "z-index: 20" apps/web/src/styles/legacy-public.css     # footer
```

## 6.5 axe（jest-axe）違反 0（AC-A6）

既存 `apps/web/src/test/axe.ts`（`configureAxe` で `color-contrast` / `region` / `landmark-one-main` を isolated fragment 向けに無効化）のパターンを流用する。collapsed render に対し違反 0 を確認する。

```tsx
import { axe } from "../../../test/axe";
// ...
it("collapsed tooltip 構成で axe 違反 0 (AC-A6)", async () => {
  const { container } = render(
    <ul>
      <SidebarNavItem item={{ id: "members", href: "/admin/members", label: "メンバー", icon: "members" }} collapsed activePath="/admin" />
    </ul>,
  );
  expect(await axe(container)).toHaveNoViolations();
});
```

| 対象 spec | axe 検証 render | 重点 |
|-----------|-----------------|------|
| `SidebarTooltip.spec` | collapsed=true の wrap（button trigger） | `role="tooltip"` + `aria-describedby` 参照先が存在（dangling reference 0） |
| `SidebarNavItem.spec` | collapsed の nav item | tooltip 追加で aria 違反が出ない |
| `SidebarUserMenu.spec` | collapsed の user menu（summary 内 tooltip） | summary の `aria-describedby` 参照先存在 / details semantics |
| `SidebarCollapseToggle.spec` | collapsed の toggle wrap | button name 保持 + describedby 参照先存在 |

> `toHaveNoViolations` の matcher は `expect.extend(toHaveNoViolations)`（jest-axe）を setup で有効化する。既存 `apps/web` の vitest setup に未登録なら各 spec 冒頭で `import { toHaveNoViolations } from "jest-axe"; expect.extend({ toHaveNoViolations });` を追加する（既存 axe 利用 spec の登録方法を踏襲）。

## 6.6 カバレッジ対象（branch 網羅）

`SidebarTooltip` は本タスク唯一の新規ロジックのため全 branch を網羅する。

| branch | 入力条件 | カバーする it |
|--------|----------|---------------|
| `collapsed === false`（早期 return） | collapsed=false | T1（パススルー）/ T8（再レンダリングで消える） |
| `collapsed === true` × 既存 aria-describedby **なし** | collapsed=true, trigger に describedby 無 | T2 / T3（id 生成 → 単独注入） |
| `collapsed === true` × 既存 aria-describedby **あり** | collapsed=true, trigger に `aria-describedby="hint-1"` | T4 / T7（既存を保持し空白連結） |
| `[existing, id].filter(Boolean)` の Boolean 分岐 | existing が undefined / 文字列 の両系 | T3（undefined → id 単独）/ T4（文字列 → 連結） |

→ `SidebarTooltip` の statements / branches / functions を full carve（早期 return・連結・useId の両 collapsed 値）。`apps/web` 全体カバレッジは Phase 7 で `test:coverage` の閾値内に収まることを確認する（shell 既存 spec と合わせて回帰チェック）。

## 6.7 レーン B / C の検証境界（再掲・honest scope）

| レーン | unit で carve | Phase 11 / 手動で carve |
|--------|---------------|--------------------------|
| C: mobile-bar | `sticky` / `top-0` / `z-30` / `md:hidden` の class 文字列（S1 / S2 / S9） | 実スクロールで上端固定（手動 + visual） |
| B: footer | （unit 不可）CSS grep（§6.4 / §4.7） | sticky bottom 固定 + 不透明背景（`public-footer-sticky-bottom.png` + 手動スクロール） |

> sticky の **固定挙動そのもの**は jsdom で観測できないため unit で assert しない（false GREEN を作らない）。class / CSS 文字列の存在契約と Phase 11 visual を分離して責務を honest に保つ。

## 6.8 実行コマンド

```bash
mise exec -- pnpm vitest run --root=../.. --config=apps/web/vitest.config.ts apps/web/src/components/shell
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens
# カバレッジ（Phase 7 と共通）
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage
```

## 6.9 touch しないもの

- 既存 it ブロックは変更しない（追記のみ・I-7 / Phase 4.1）。
- Playwright / e2e / staging-visual project は本 Phase で触らない（Phase 11 担当）。
- `apps/api` / D1 / auth / Google Form schema の spec には一切触れない（I-1）。

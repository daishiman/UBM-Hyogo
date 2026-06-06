---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 4
phase_name: テスト計画
created_at: 2026-06-03
task_type: implementation
visual_category: VISUAL
implementation_mode: new
workflow: docs/30-workflows/shell-sidebar-tooltip-footer-header-responsive/
---

# Phase 4: テスト計画

TDD（RED → GREEN）でレーン A（collapsed ツールチップ）の DOM 契約を unit（RTL @ vitest）で carve する。レーン B（フッター sticky）は jsdom で sticky 挙動を観測できないため主検証を Phase 11（Playwright visual + 手動）とし、unit では `legacy-public.css` への CSS 文字列存在を補助 grep で確認する。レーン C（mobile-bar sticky）は class 文字列を `SidebarShell.spec` で assert（DOM 契約）+ Phase 11 で実スクロール確認。

本 Phase は **RED 期待**（でテストを先に書く）。各テストの `describe`/`it` 名・期待値（expected）を具体化し、Phase 5 実装後に Phase 6 で GREEN 化 + fail-path / 回帰 guard を足す。

## 4.0 検証層マトリクス（レーン × 検証手段）

| レーン | 検証層 | 観測対象（テストが触る入力） | 限界 |
|--------|--------|------------------------------|------|
| A: ツールチップ | RTL unit（DOM 契約）+ Phase 11 visual | prop `collapsed`（true/false）+ trigger 要素の `aria-describedby` | `:hover`/`:focus-within` の視覚表示自体は CSS で jsdom 非観測。unit は「role=tooltip 要素 / aria-describedby 配線 / collapsed=false パススルー」の DOM 契約のみ carve |
| B: フッター sticky | Phase 11 visual + 手動 + CSS grep（補助） | （unit 不可）`legacy-public.css` への文字列存在 | `position: sticky; bottom: 0` の固定挙動は layout reflow を要するため jsdom 非観測。**honest scope**: 主検証は Phase 11、unit は CSS 文字列存在の補助確認のみ |
| C: mobile-bar sticky | RTL class assert + Phase 11 手動 | `SidebarShell` render 結果の mobile-bar `className` | sticky の実固定は Phase 11。unit は class 文字列（`sticky` / `top-0` / `z-30` / `md:hidden`）の DOM 契約 |

> **テスト操作対象は prop（`collapsed`）であること**: レーン A の全 unit は `collapsed` prop の true/false を切り替えて DOM 差分を assert する。CSS の hover state を `fireEvent` で擬似発火しても jsdom は `:hover` を反映しないため、テストは hover を発火させず「collapsed=true で role=tooltip 要素が DOM に存在する」「collapsed=false で存在しない」という構造契約を検証する。

## 4.1 spec ファイル一覧（新規 1 / 編集 3 / 新規 or 編集 1）

| # | spec path | 種別 | 対象 | 主 AC |
|---|-----------|------|------|-------|
| 1 | `apps/web/src/components/shell/__tests__/SidebarTooltip.spec.tsx` | 新規 | `SidebarTooltip.tsx`（新規 primitive） | AC-A1 / AC-A2 / AC-A3 / AC-A6 |
| 2 | `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` | 編集（append） | nav item の collapsed tooltip 配線 | AC-A1 / AC-A2 / AC-A6 |
| 3 | `apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx` | 編集（append） | mobile-bar sticky / AdminPublicReturn tooltip / UserMenu tooltip | AC-A5 / AC-C1 / AC-C2 / AC-C3 |
| 4 | `apps/web/src/components/shell/__tests__/SidebarCollapseToggle.spec.tsx` | 新規 | collapse toggle の collapsed tooltip | AC-A5 |
| 5 | `apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx` | 編集（append） | user menu の `<summary>` 内 tooltip バブル（D-3） | AC-A5 / AC-A6 |

> 既存 it ブロックは変更しない（**追記のみ**）。既存 query（`data-shell-block="nav-item"`、`aria-current`、nav 数）が GREEN を維持することを Phase 6 で回帰確認する。

## 4.2 `SidebarTooltip.spec.tsx`（新規・AC-A1 / A2 / A3 / A6）

`SidebarTooltip` は単一の trigger 要素を受け取り、`collapsed=true` のときだけ `role="tooltip"` バブルを sibling として描画し trigger に `aria-describedby` を注入する wrapper（Phase 2 §2.1.1）。trigger は単一 React 要素（`<a>`/`<button>` 等）で渡す。

```tsx
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SidebarTooltip } from "../SidebarTooltip";

afterEach(() => cleanup());
```

| # | it | 操作（prop） | expected | AC |
|---|----|--------------|----------|----|
| T1 | "collapsed=false では children をそのまま返し tooltip を描画しない" | `collapsed={false}` で `<button data-testid="trig">アイコン</button>` を wrap | `container.querySelector('[role="tooltip"]')` が `null` / `data-shell-block="tooltip-wrap"` が不在 / trigger（`[data-testid="trig"]`）に `aria-describedby` が付かない（`getAttribute("aria-describedby")` が `null`） | AC-A2 |
| T2 | "collapsed=true で role=tooltip バブルを sibling 描画し textContent=label" | `collapsed`, `label="会員ディレクトリ"` | `container.querySelector('[role="tooltip"]')` が存在 / その `textContent` が `"会員ディレクトリ"` / `.className` に `ubm-shell-tooltip` を含む | AC-A1 |
| T3 | "collapsed=true で一意 id を生成し trigger の aria-describedby に含める" | `collapsed`, trigger に元 `aria-describedby` なし | tooltip の `id` が空でない（`useId()` 由来） / trigger の `aria-describedby` が tooltip `id` と一致 | AC-A3 |
| T4 | "既存 aria-describedby があれば tooltip id を空白連結する（上書きしない）" | trigger を `<button aria-describedby="hint-1">` で渡す | trigger の `aria-describedby` が `"hint-1 <tooltipId>"`（既存 id を先頭に保持し tooltip id を追記・split(" ") に両方含む） | AC-A3 / AC-A6 |
| T5 | "wrap ラッパに data-shell-block=tooltip-wrap と ubm-shell-tooltip-wrap class が付く" | `collapsed` | `container.querySelector('[data-shell-block="tooltip-wrap"]')` が存在し `.className` に `ubm-shell-tooltip-wrap` を含む | AC-A1 |
| T6 | "tooltip バブルに aria-hidden を付けない（aria-describedby 参照先のため）" | `collapsed` | `container.querySelector('[role="tooltip"]')?.getAttribute("aria-hidden")` が `null` | AC-A6 |

> **二重読み上げ回避の根拠（AC-A6 / I-8）**: tooltip は `role="tooltip"` + `aria-describedby` の **description** として関連付けるのみで、trigger の accessible name（sr-only ラベル / aria-label）は移管しない。T4 は「name を奪わず description を加算」する設計を、`aria-describedby` の連結で carve する。

### 4.2.1 private / internal の扱い

`SidebarTooltip` は公開 export（shell 配下の primitive）。内部の `useId()` 生成 id は実装詳細だが、`aria-describedby` 連携の検証に必要なため「trigger の `aria-describedby` 値と tooltip 要素の `id` 値の一致」という**観測可能な契約**として assert する（id の具体値は固定しない）。tooltip の表示/非表示は CSS（`:hover`/`:focus-within`）の責務で internal であり、unit では検証しない（Phase 11 委譲）。

## 4.3 `SidebarNavItem.spec.tsx`（編集・append・AC-A1 / A2 / A6）

既存 4 it は不変。以下を `describe("SidebarNavItem collapsed tooltip", ...)` として **追記**する。`SidebarTooltip` は実 import（mock しない）で配線を検証する。

| # | it | 操作（prop） | expected | AC |
|---|----|--------------|----------|----|
| N1 | "collapsed で nav link が tooltip wrap される（role=tooltip=label）" | `collapsed`, item.label="メンバー" | `container.querySelector('[data-shell-block="tooltip-wrap"]')` が存在 / `[role="tooltip"]` の textContent が `"メンバー"` | AC-A1 |
| N2 | "collapsed でも data-shell-block=nav-item がリンク要素（a）として存続する" | `collapsed` | `container.querySelector('[data-shell-block="nav-item"]')` が `<a>` 要素で存在し続ける（wrap で消えない）/ `.tagName` が `"A"` | AC-A1 / 回帰 |
| N3 | "collapsed で nav link の aria-describedby が tooltip id を含む" | `collapsed` | `[data-shell-block="nav-item"]` の `aria-describedby` が `[role="tooltip"]` の `id` と一致 | AC-A3 |
| N4 | "expanded では tooltip wrap も role=tooltip も描画しない（children 直返し）" | `collapsed={false}` | `[data-shell-block="tooltip-wrap"]` が `null` / `[role="tooltip"]` が `null` / `[data-shell-block="nav-item"]` は従来どおり存在 | AC-A2 |
| N5 | "collapsed でも sr-only ラベルが accessible name として維持され二重読み上げにならない" | `collapsed` | label を含む `<span>` が `sr-only` class を保持（既存 it 同等）/ link の accessible name は label のまま（tooltip は description であり name を奪わない） | AC-A6 |
| N6 | "external item も collapsed で tooltip wrap される（a[target=_blank] を保持）" | `collapsed`, `external: true` | `[role="tooltip"]` が存在 / `[data-shell-block="nav-item"]` が `<a target="_blank" rel="noopener noreferrer">` のまま | AC-A1 / 回帰 |
| N7 | "aria-current（active）既存挙動が collapsed tooltip 追加後も維持される" | `collapsed`, pathname 一致 | `[data-shell-block="nav-item"]` の `aria-current` が `"page"` / `data-active="true"` を保持 | 回帰 |

> N6: `SidebarNavItem` は `item.external` 分岐で `<a>`、通常分岐で `<Link>`（jsdom 上は `<a>`）を描画する。両分岐とも collapsed 時に `SidebarTooltip` で wrap される設計（Phase 2 §2.1.4）のため、external/通常それぞれで tooltip 配線を carve する。

## 4.4 `SidebarShell.spec.tsx`（編集・append・AC-A5 / C1 / C2 / C3）

既存 11 it は不変。`renderShell(role, initialCollapsed)` ヘルパを流用し、以下を `describe("SidebarShell sticky header & collapsed tooltip", ...)` として **追記**する。

### レーン C（mobile-bar sticky）

| # | it | 操作 | expected | AC |
|---|----|------|----------|----|
| S1 | "mobile-bar に sticky top-0 z-30 が付く" | `renderShell("member")` | `container.querySelector('[data-shell="mobile-bar"]')?.className` が `sticky` / `top-0` / `z-30` を全て含む | AC-C1 / AC-C2 |
| S2 | "mobile-bar の md:hidden が維持される（md 以上で従来通り非表示）" | `renderShell("member")` | mobile-bar の `className` が `md:hidden` を含む | AC-C3（回帰） |

### レーン A（footer 内コントロールの collapsed tooltip）

| # | it | 操作 | expected | AC |
|---|----|------|----------|----|
| S3 | "collapsed で AdminPublicReturn が tooltip 化され title 属性が除去される" | `renderShell("admin", true)` | `[data-component="admin-sidebar-public-return"]` の `getAttribute("title")` が `null`（旧 native title を撤去）/ desktop aside 配下に `[role="tooltip"]` で textContent=`"公開サイトに戻る"` の要素が存在 | AC-A5 |
| S4 | "expanded では AdminPublicReturn に tooltip も title も付かない" | `renderShell("admin", false)` | `[data-component="admin-sidebar-public-return"]` の `title` が `null` かつ aside 配下の対応 `[role="tooltip"]`（"公開サイトに戻る"）が不在 | AC-A2 / AC-A5 |
| S5 | "collapsed で user menu の summary 内に role=tooltip バブルが存在する（D-3）" | `renderShell("admin", true)` | `[data-shell-block="user-menu"] summary [role="tooltip"]` が存在し textContent が `"ユーザーメニュー"` | AC-A5 |

> S3 / S5 は desktop `<aside>`（collapsed）配下を対象にする。drawer ツリーは `sidebarFooterContent(false)`（常に expanded 引数）で描画されるため tooltip を持たない。assert は `[data-shell="sidebar"]`（aside）スコープ内で querySelector し、drawer 側の二重ヒットを避ける。
>
> S3 補足: 現行 `AdminPublicReturn` は collapsed 時のみ `title="公開サイトに戻る"` を付与している（`SidebarShell.tsx:30`）。本タスクで title を撤去し `SidebarTooltip` wrap へ置換するため、S3 は「title が消える」+「role=tooltip が出る」の双方を assert して移行を carve する。

## 4.5 `SidebarCollapseToggle.spec.tsx`（新規・AC-A5）

`SidebarCollapseToggle` は `useSidebarShellContext()` の `mode` で collapsed を判定する。context を `vi.mock` で差し替え、collapsed / expanded を切り替える。

```tsx
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const toggleCollapsed = vi.fn();
let mockMode: "collapsed" | "expanded" = "collapsed";
vi.mock("../SidebarShellContext", () => ({
  useSidebarShellContext: () => ({
    mode: mockMode,
    drawerOpen: false,
    toggleCollapsed,
    setDrawerOpen: vi.fn(),
  }),
}));

import { SidebarCollapseToggle } from "../SidebarCollapseToggle";

afterEach(() => cleanup());
```

| # | it | 操作 | expected | AC |
|---|----|------|----------|----|
| C1 | "collapsed で toggle button が tooltip wrap され role=tooltip=ラベル" | `mockMode="collapsed"` | `[data-shell-block="tooltip-wrap"]` が存在 / `[role="tooltip"]` の textContent が `"サイドバーを展開"` / `[data-shell-block="collapse-toggle"]` が `<button>` で存続 | AC-A5 |
| C2 | "collapsed で button の aria-describedby が tooltip id を含む" | `mockMode="collapsed"` | toggle button の `aria-describedby` が `[role="tooltip"]` の `id` と一致 | AC-A3 |
| C3 | "expanded では tooltip を描画しない（button 直返し）" | `mockMode="expanded"` | `[role="tooltip"]` が `null` / `[data-shell-block="collapse-toggle"]` は存在 | AC-A2 |
| C4 | "click で toggleCollapsed が呼ばれる（wrap 後も既存挙動維持）" | `mockMode="collapsed"`, button click | `toggleCollapsed` が 1 回呼ばれる | 回帰 |
| C5 | "collapsed でも aria-label='サイドバーを展開' を保持（name は tooltip へ移管しない）" | `mockMode="collapsed"` | button の `aria-label` が `"サイドバーを展開"` のまま | AC-A6 |

> `mockMode` は `let` で宣言し、各 it 先頭で代入してから render する（mock factory は単一だが変数参照で分岐）。

## 4.6 `SidebarUserMenu.spec.tsx`（編集・append・AC-A5 / A6・D-3）

user menu は D-3 により `SidebarTooltip` wrap を使わず、collapsed 時に `<summary>` 内へ `<span role="tooltip">` を直接配置する（`<details>` 直下子が `<summary>` でなければならない制約への対応）。既存 it は不変、以下を **追記**する。

| # | it | 操作（prop） | expected | AC |
|---|----|--------------|----------|----|
| U1 | "collapsed で summary 内に role=tooltip バブル（ユーザーメニュー）が直接配置される" | `collapsed` | `container.querySelector('[data-shell-block="user-menu"] summary [role="tooltip"]')` が存在し textContent=`"ユーザーメニュー"` / `.className` に `ubm-shell-tooltip` を含む | AC-A5 |
| U2 | "collapsed で summary に aria-describedby が tooltip id を含む" | `collapsed` | `summary` の `aria-describedby` が内部 `[role="tooltip"]` の `id` と一致 | AC-A3 |
| U3 | "expanded では tooltip バブルを描画しない" | `collapsed={false}` | `summary [role="tooltip"]` が `null` | AC-A2 |
| U4 | "collapsed でも summary の aria-label='ユーザーメニュー' を保持（二重読み上げ回避）" | `collapsed` | `summary` の `aria-label` が `"ユーザーメニュー"` のまま（tooltip は description 加算） | AC-A6 |
| U5 | "details の直下子が summary であり続ける（semantics 不変・D-3）" | `collapsed` | `details > summary` 構造が維持（`details.firstElementChild?.tagName === "SUMMARY"`）/ tooltip は summary の sibling ではなく内部子 | AC-A6 / 回帰 |

## 4.7 レーン B（フッター sticky）— jsdom 非観測の明記 + CSS grep 補助

**honest scope**: `position: sticky; bottom: 0` の固定挙動は layout reflow を要し jsdom では観測できない（`getComputedStyle` は CSS ファイルの static 値を返すだけで sticky の pin 挙動は再現されない）。よってレーン B の AC-B1 / AC-B2 は **Phase 11 Playwright visual（`public-footer-sticky-bottom.png`）+ 手動スクロール確認**を主検証とする。

unit / CI では以下の **CSS 文字列存在 grep** を補助確認として行う（Phase 9 の手動 grep ステップ。専用テストファイルは作らない）:

```bash
# legacy-public.css の base ブロック [data-component="public-footer"]（716 付近）に
# sticky / bottom: 0 / surface-bg 背景が入っていることを確認
grep -nE "position: sticky|bottom: 0|background: var\(--ubm-color-surface-bg\)" apps/web/src/styles/legacy-public.css

# HEX 直書きが入っていないこと（AC-B3 / verify-design-tokens と重複だが手動補助）
grep -nE "#[0-9a-fA-F]{3,6}" apps/web/src/styles/legacy-public.css   # footer ブロックに新規 HEX が無いこと
```

| AC | 検証手段 | 期待 |
|----|----------|------|
| AC-B1 | Phase 11 visual + 手動スクロール | スクロール中もフッターが viewport 下端に固定表示 |
| AC-B2 | CSS grep（`background: var(--ubm-color-surface-bg)`）+ visual | フッター背景が不透明でコンテンツが透けない |
| AC-B3 | `verify-design-tokens`（既存 CI gate）+ grep | footer ブロックに HEX 0・色は全て token |

## 4.8 RTL 環境・モック方針

- **render 環境**: 既存 `apps/web/vitest.config.ts`（jsdom）を踏襲。`@testing-library/react` の `render` / `cleanup`、`vitest` の `vi.mock`。`afterEach(() => cleanup())` を各 spec に置く。
- **`next/navigation`**: 既存 spec と同様 `vi.mock("next/navigation", () => ({ usePathname: vi.fn(() => "/...") }))` で固定。`SidebarShell.spec` は `vi.mock("next-auth/react", () => ({ signOut: vi.fn() }))` も既存どおり維持。
- **`SidebarShellContext`（CollapseToggle 用）**: `vi.mock("../SidebarShellContext", ...)` で `mode` を差し替える（4.5）。
- **`window` 系モック**: 本タスクは `collapsed` prop 駆動であり `matchMedia` / `Object.defineProperty(window, "matchMedia", ...)` 等の viewport モックは**不要**（sticky の実観測は Phase 11 へ委譲するため）。`SidebarTooltip` は CSS hover 駆動で JS state を持たず（I-4）、テストは hover を発火させず DOM 構造のみ assert する。jsdom が `:hover` を反映しない制約は本タスクの unit 設計（構造契約のみ検証）と整合する。
- **テスト操作対象**: 全 unit の唯一の操作軸は **prop `collapsed`（true/false）**（CollapseToggle のみ context `mode`）。これを切り替えて tooltip 要素の有無・`aria-describedby` 配線を carve する。

## 4.9 実行コマンド

`apps/web/package.json` の `test` script は `vitest run --passWithNoTests --root=../.. --config=vitest.config.ts apps/web`。shell ディレクトリに絞った focused 実行は以下:

```bash
# shell ディレクトリ全 spec（focused）
mise exec -- pnpm vitest run --root=../.. --config=apps/web/vitest.config.ts apps/web/src/components/shell

# 個別 spec（RED 確認時）
mise exec -- pnpm vitest run --root=../.. --config=apps/web/vitest.config.ts \
  apps/web/src/components/shell/__tests__/SidebarTooltip.spec.tsx

# 型・lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 色 token gate（AC-A4 / AC-B3）
mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens
```

> 既存 `pnpm --filter @ubm-hyogo/web test` は `--root=../..` 前提のため、ワークツリー直下からは上記 `pnpm vitest run --root=../.. --config=apps/web/vitest.config.ts <path>` 形式で focused 実行する（`apps/web` を作業 root とする `--filter` でも同義）。

## 4.10 RED 期待サマリ

| spec | RED の理由（Phase 5 前に失敗する根拠） |
|------|------------------------------------------|
| `SidebarTooltip.spec` | `SidebarTooltip.tsx` 未実装 → import で失敗（全 6 ケース RED） |
| `SidebarNavItem.spec`（N1-N7） | 現行 nav item は collapsed で tooltip wrap せず `[role="tooltip"]` が出ない（N1/N3/N6 RED）。N2/N4/N7 は既存挙動で先に GREEN になりうるが回帰 guard として置く |
| `SidebarShell.spec`（S1-S5） | mobile-bar に `sticky top-0 z-30` 未付与（S1 RED）。AdminPublicReturn は title のまま tooltip 無し（S3/S5 RED） |
| `SidebarCollapseToggle.spec` | 現行 toggle は tooltip 無し（C1-C3 RED）。C4/C5 は既存挙動で GREEN になりうるが回帰 guard |
| `SidebarUserMenu.spec`（U1-U5） | summary 内 tooltip バブル未配置（U1-U2 RED） |

→ Phase 5（実装手順）で GREEN 化し、Phase 6 で fail-path / 回帰 / axe を追加する。

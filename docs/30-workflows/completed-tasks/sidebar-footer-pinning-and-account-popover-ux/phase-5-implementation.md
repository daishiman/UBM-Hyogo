# Phase 5: 実装手順

## メタ情報

| 項目 | 値 |
|------|----|
| task_id | sidebar-footer-pinning-and-account-popover-ux |
| phase | 5 / 13 |
| 名称 | 実装手順（GREEN）|
| 前提 | Phase 4（テスト計画 RED）完了 |
| 実装順序 | **直列**（C1 → C4 → C2 → C3。`SidebarShell.tsx` / `SidebarUserMenu.tsx` が複数 concern に跨るため）|
| state owner | popover=`<details>.open` 正本 / collapse=`useSidebarState`（不変・I-1/I-2）|

## 目的

Phase 2 の Before/After 設計を、後続実装者がそのまま着手できる**具体差分（className / CSS / 関数シグネチャ / import）**へ落とし込む。新規ソース 0・編集 5（CSS 2 + component 3）+ テスト 3 の範囲で AC-1〜AC-6 を満たし、不変条件 I-1〜I-8 を実装ステップに織り込む。

## 実行タスク

### 新規作成 / 修正ファイル一覧（[Feedback RT-03] 必須）

| パス | 変更種別 | concern | 主な変更 |
|------|---------|---------|---------|
| `apps/web/src/styles/globals.css` | 編集 | C1, C2 | `[data-shell="sidebar"]`（行 1417 / 行 1547 の 2 ブロック）`min-height:100vh` → `height:100vh` + `height:100dvh` + `overflow:hidden` |
| `apps/web/src/components/shell/SidebarShell.tsx` | 編集 | C1, C2, C4 | `sidebarContent` を「scroll 部 + `sidebar-footer` 固定部」へ再編 / aside に `overflow-hidden` / `<main>` flex-column / `AdminPublicReturn` collapsed `justify-center` |
| `apps/web/src/components/shell/SidebarUserMenu.tsx` | 編集 | C2, C3 | 外側クリック + Escape の `useEffect` 追加（`browserDocument()` 経由）/ `details.open` guard / summary collapsed `justify-center` |
| `apps/web/src/components/shell/SidebarNavItem.tsx` | 編集 | C2 | 行 className に collapsed `justify-center` + `relative` / badge collapsed をドット（`nav-badge-dot`）化 |
| `apps/web/src/styles/legacy-public.css` | 編集 | C4 | `[data-component="public-footer"]`（行 716）`margin-top:40px` → `margin-top:auto` |
| `apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx` | テスト編集 | C1, C2, C4 | TC-C1-01〜06 / TC-C2-06 / TC-C4-01〜02 |
| `apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx` | テスト編集 | C2, C3 | TC-C2-05 / TC-C3-01〜06 |
| `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` | テスト編集 | C2 | TC-C2-01〜04（**新規でなく既存 3 ケースへ追記**）|

> 新規ソースファイルは増やさない（I-1/I-2 後方互換）。`browserDocument()`（`apps/web/src/lib/is-browser.ts`）が document アクセスの唯一の入口（I-5）。

### 入力 / 出力 / 副作用の定義

| 対象 | 入力 | 出力 | 副作用 |
|------|------|------|--------|
| `SidebarShell` | props（role / user / navGroups / activePath / initialCollapsed 他・**不変**）| 2 段 aside + flex-column main の DOM | なし（純レンダリング）|
| `SidebarUserMenu` の新 `useEffect` | `details.open`（`<details>.open` のミラー）| — | `details.open===true` のときのみ document に `pointerdown` / `keydown` listener 登録、cleanup で解除。SSR/Workers では `browserDocument()===undefined` で **no-op**（I-5/I-6）|
| `SidebarNavItem` | props（item / collapsed / activePath・不変）| collapsed で `justify-center` + ドット badge | なし |
| CSS（globals / legacy-public）| — | sidebar height 固定 / footer margin-auto | なし（静的）|

---

### T1: C1 sidebar フッター固定（globals.css + SidebarShell.tsx aside）

**ステップ 1-1: CSS（`globals.css` 行 1417 / 行 1547 の 2 ブロック双方）**

Before:
```css
[data-shell="sidebar"] {
  position: sticky;
  top: 0;
  min-height: 100vh;
  border-right: 1px solid var(--ubm-color-border-default);
  background: var(--ubm-color-surface-panel);
}
```

After（**2 箇所とも同一に**）:
```css
[data-shell="sidebar"] {
  position: sticky;
  top: 0;
  height: 100vh;     /* fallback（100dvh 非対応ブラウザ・TECH-M-03）*/
  height: 100dvh;    /* dynamic viewport: モバイル URL バー変動に追従 */
  overflow: hidden;  /* 内部スクロール委譲（C1）+ collapse はみ出し物理クリップ（C2）*/
  border-right: 1px solid var(--ubm-color-border-default);
  background: var(--ubm-color-surface-panel);
}
```

> 2 ブロックは別 media query / theme スコープに属する重複定義。**片方だけ直すと不整合**になるため双方を同値に揃える（phase-2 設計準拠）。`grep -n 'data-shell="sidebar"' apps/web/src/styles/globals.css` で 1417 / 1547 / 2010 を確認。行 2010 は `[data-route-group="admin"]` 限定の別宣言のため本タスクでは触らない（width 等で height を再宣言していないことを確認のうえ非変更）。

**ステップ 1-2: JSX（`SidebarShell.tsx`）`sidebarContent` を 2 段化**

Before（現行 74-81 行 + aside 92-101 行）:
```tsx
const sidebarContent = (sidebarCollapsed: boolean) => (
  <>
    <SidebarBrand collapsed={sidebarCollapsed} />
    <SidebarNav navGroups={navGroups} collapsed={sidebarCollapsed} activePath={activePath} />
    {role === "admin" ? <AdminPublicReturn collapsed={sidebarCollapsed} /> : null}
    <SidebarUserMenu role={role} user={user} collapsed={sidebarCollapsed} />
  </>
);
// ...
<aside ... className="hidden w-[var(--shell-bar-w)] shrink-0 flex-col gap-3 border-r ... p-3 data-[collapsed=true]:w-[var(--shell-bar-w-collapsed)] md:flex">
  {sidebarContent(collapsed)}
  <div className="mt-auto flex justify-end pt-2">
    <SidebarCollapseToggle />
  </div>
</aside>
```

After:
```tsx
const sidebarContent = (sidebarCollapsed: boolean) => (
  <>
    <SidebarBrand collapsed={sidebarCollapsed} />
    <SidebarNav navGroups={navGroups} collapsed={sidebarCollapsed} activePath={activePath} />
    <div
      data-shell-block="sidebar-footer"
      className="flex shrink-0 flex-col gap-3 border-t border-[var(--shell-bar-border)] pt-3"
    >
      {role === "admin" ? <AdminPublicReturn collapsed={sidebarCollapsed} /> : null}
      <SidebarUserMenu role={role} user={user} collapsed={sidebarCollapsed} />
      <div className={`flex ${sidebarCollapsed ? "justify-center" : "justify-end"}`}>
        <SidebarCollapseToggle />
      </div>
    </div>
  </>
);
// ...
<aside
  data-shell="sidebar"
  data-collapsed={collapsed ? "true" : "false"}
  className="hidden w-[var(--shell-bar-w)] shrink-0 flex-col gap-3 overflow-hidden border-r border-[var(--shell-bar-border)] bg-[var(--shell-bar-bg)] p-3 data-[collapsed=true]:w-[var(--shell-bar-w-collapsed)] md:flex"
>
  {sidebarContent(collapsed)}
</aside>
```

ポイント:
- 旧 `<div className="mt-auto flex justify-end pt-2"><SidebarCollapseToggle /></div>` を撤去し、`sidebar-footer` ブロック内へ移設。これで drawer（`sidebarContent(false)`）でも同じ footer 構造を共有（既存どおり collapse-toggle は `md:` 限定表示のため drawer 内では非表示）。
- `SidebarNav`（nav 内部）の scroll 領域が `flex-1 overflow-y-auto` を持つことを確認する。持っていない場合は `SidebarNav.tsx` の最外殻 `<nav>`（または scroll wrapper）に `flex-1 overflow-y-auto min-h-0` を付与する（**TC-C1-04 の前提**。phase-2 では nav は既存どおりとあるため、実コードで `flex-1 overflow-y-auto` が無ければ最小追加し、テスト契約に合わせる）。`min-h-0` は flex 子の overflow を効かせる定石。
- aside に `overflow-hidden` を追加（C2 と共用）。`gap-3` / `border-r` / `bg-[var(--shell-bar-bg)]` / width トークンは不変。
- `data-shell="sidebar"` / `data-collapsed` は維持（I-7）。`data-shell-block="sidebar-footer"` は additive。
- `mt-auto` は付けない（nav の `flex-1` が残余高さを吸収し footer が自然に最下部）。

**T1 後の検証**:
```bash
pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx
```
TC-C1-01〜06 が GREEN・既存 7 ケースが回帰なしを確認。

---

### T4: C4 main footer sticky（SidebarShell.tsx main + legacy-public.css）

**ステップ 4-1: JSX（`SidebarShell.tsx` `<main>` 117-124 行）**

Before:
```tsx
<main
  data-shell="main"
  data-route={routeKey}
  {...(sectionRhythm ? { "data-section-rhythm": sectionRhythm } : {})}
  className="min-w-0 flex-1"
>
  {children}
</main>
```

After:
```tsx
<main
  data-shell="main"
  data-route={routeKey}
  {...(sectionRhythm ? { "data-section-rhythm": sectionRhythm } : {})}
  className="flex min-w-0 flex-1 flex-col"
>
  {children}
</main>
```

> `data-shell` / `data-route` / `data-section-rhythm` は不変（I-7）。`min-w-0 flex-1` を維持しつつ `flex flex-col` を追加（TC-C4-01/02）。

**ステップ 4-2: CSS（`legacy-public.css` 行 716 ブロック）**

Before:
```css
[data-component="public-footer"] {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 32px 28px;
  margin-top: 40px;
  border-top: 1px solid var(--ubm-color-border-default);
  color: var(--ubm-color-text-secondary);
  font-size: 12px;
}
```

After:
```css
[data-component="public-footer"] {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 32px 28px;
  margin-top: auto;   /* was: 40px — sticky footer 化（C4）。上 padding 32px が余白を保持 */
  border-top: 1px solid var(--ubm-color-border-default);
  color: var(--ubm-color-text-secondary);
  font-size: 12px;
}
```

> **注意**: `legacy-public.css` には `[data-component="public-footer"]` ブロックが**もう 1 箇所（行 1186 付近）**ある（`margin-top: var(--ubm-space-12)` / `flex-direction` 横並び）。これは別 media query / 別レイアウト variant のため、まず行 716 のみ `margin-top:auto` 化して `(public)/layout.spec` / `PublicFooter.spec` を回す。行 1186 が実際に footer の最終レンダリングへ効くスコープであれば同様に `margin-top:auto` へ揃える（Phase 9 で 3 layout 回帰確認しながら判断）。**HEX 直書きは増やさない**（既存トークンのみ）。

**T4 後の検証**:
```bash
pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx \
  apps/web/src/components/public/__tests__/PublicFooter.spec.tsx \
  apps/web/app/(public)/layout.spec.tsx
```
TC-C4-01/02 GREEN・P-5（footer shell 配下）回帰なしを確認。

---

### T2: C2 collapse はみ出し（SidebarNavItem.tsx + SidebarUserMenu.tsx summary + SidebarShell.tsx AdminPublicReturn）

**ステップ 2-1: `SidebarNavItem.tsx` 行 className に collapsed `justify-center` + `relative`、badge ドット化**

行クラス（internal Link 行 75 / external anchor 行 61）の base に `relative` を追加し、collapsed のとき `justify-center` を付与する。重複を避けるため定数化を推奨:

```tsx
const ROW_BASE =
  "relative flex items-center gap-3 rounded-sm px-3 py-2 text-sm text-[var(--ubm-color-text-primary)] hover:bg-[var(--shell-active-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)]";
const rowLayout = collapsed ? "justify-center" : "";
// internal:
//   className={`${ROW_BASE} ${rowLayout} data-[active=true]:bg-[var(--shell-active-bg)] data-[active=true]:font-semibold data-[active=true]:text-[var(--ubm-color-accent-ink)]`}
// external:
//   className={`${ROW_BASE} ${rowLayout}`}
```

badge（現行 46-50 行）を collapsed でドット化:
```tsx
{showBadge && item.badge ? (
  collapsed ? (
    <span
      data-shell-block="nav-badge-dot"
      className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[var(--ubm-color-accent-ink)]"
    >
      <span className="sr-only">{item.badge.count}</span>
    </span>
  ) : (
    <Chip tone={TONE_TO_CHIP[item.badge.tone]}>{item.badge.count}</Chip>
  )
) : null}
```

ポイント:
- TECH-M-01（Phase 3 MINOR）に従い、ドット内に `sr-only` で件数を保持（a11y）。親ドットに `aria-hidden` は付けず、可視表示は点、スクリーンリーダーには件数を残す。
- ドットを `absolute right-1 top-1` で出すため行 base に `relative` 必須（上記）。
- 色は `var(--ubm-color-accent-ink)` トークン（HEX 禁止・I-4/AC-5）。
- `collapsed={false}` のとき `Chip`（数値）描画・`nav-badge-dot` 非描画（TC-C2-04）。

**ステップ 2-2: `SidebarUserMenu.tsx` summary に collapsed `justify-center`**

summary（行 42）の className に collapsed 出し分けを追加:
```tsx
className={`flex cursor-pointer list-none items-center gap-2 rounded-sm px-3 py-2 ${collapsed ? "justify-center" : ""} hover:bg-[var(--shell-active-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)]`}
```
> displayName の `sr-only`（collapsed）は既存どおり維持（既存 spec の回帰 guard）。

**ステップ 2-3: `SidebarShell.tsx` `AdminPublicReturn` collapsed `justify-center`**

`AdminPublicReturn` の `<Link>`（行 31）className に collapsed 出し分けを追加:
```tsx
className={`flex items-center gap-3 rounded-sm px-3 py-2 text-sm text-[var(--ubm-color-text-secondary)] ${collapsed ? "justify-center" : ""} hover:bg-[var(--shell-active-bg)] hover:text-[var(--ubm-color-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)]`}
```
> `data-role="public-return"` / `data-component="admin-sidebar-public-return"` / `aria-label` / collapsed `title` / ラベル `sr-only` は不変（I-7）。

**T2 後の検証**:
```bash
pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx \
  apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx \
  apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx
```
TC-C2-01〜06 GREEN・既存 collapsed sr-only ケース回帰なしを確認。

---

### T3: C3 popover 外側クリック / Escape（SidebarUserMenu.tsx effect）

**ステップ 3-1: import 追加**

```tsx
import { useEffect, useRef } from "react";
import { browserDocument } from "../../lib/is-browser";
```
> `usePathname` / `Link` 等の既存 import は維持。`document` 直接参照は禁止（I-5）。`../../lib/is-browser` の相対深さは `SidebarUserMenu.tsx` の位置（`apps/web/src/components/shell/`）基準で確認すること。

**ステップ 3-2: 外側クリック / Escape の `useEffect`**

```tsx
const detailsRef = useRef<HTMLDetailsElement>(null);
const pathname = usePathname();

// route 変化で popover を自動 close（既存挙動維持）
useEffect(() => {
  if (detailsRef.current) detailsRef.current.open = false;
}, [pathname]);

// 外側クリック / Escape で close
useEffect(() => {
  const doc = browserDocument();
  if (!doc) return; // SSR / Workers: no-op（I-5/I-6）
  const onPointerDown = (e: PointerEvent) => {
    const el = detailsRef.current;
    if (!el?.open) return;
    if (e.target instanceof Node && el.contains(e.target)) return;
    el.open = false;
  };
  const onKeyDown = (e: KeyboardEvent) => {
    const el = detailsRef.current;
    if (!el?.open || e.key !== "Escape") return;
    el.open = false;
  };
  doc.addEventListener("pointerdown", onPointerDown);
  doc.addEventListener("keydown", onKeyDown);
  return () => {
    doc.removeEventListener("pointerdown", onPointerDown);
    doc.removeEventListener("keydown", onKeyDown);
  };
}, []);
```

**ステップ 3-3: `<details>.open` を開閉正本として維持**

```tsx
<details
  ref={detailsRef}
  data-shell-block="user-menu"
  className="group relative border-t border-[var(--shell-bar-border)] pt-2"
>
  {/* summary（collapsed justify-center は T2 で対応）/ popover は既存どおり */}
</details>
```

設計上の注意（phase-2 準拠）:
- `pointerdown` を使う理由: `click` だと popover 内 `<Link>` 遷移と競合する。`pointerdown` + `contains` で「外側押下」のみ捕捉。popover 内リンククリックは route 変化 effect が close を担う（既存）。
- summary クリックで開閉しても、**summary 自身は `el.contains(target)===true`** なので外側判定で誤閉じしない（TC-C3-05）。
- `<details>.open` が開閉の正本。React state を新たな開閉正本にしない。
- `aria-haspopup="menu"` / summary トグル / キーボード操作は維持（I-8）。

**T3 後の検証**:
```bash
pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx
```
TC-C3-01〜06 GREEN・既存 5 ケース回帰なしを確認。

---

### 不変条件 I-1〜I-8 の遵守チェック（実装ステップ織り込み）

| 不変条件 | 実装での担保 | 確認ステップ |
|----------|-------------|-------------|
| I-1 hook/props 不変 | `useSidebarState` 戻り値・`SidebarShell` props 非変更。aside/main 内部 JSX のみ変更 | T1/T4 後に props interface 差分なしを確認 |
| I-2 state owner 単一 | popover=`<details>.open` 正本。collapse=`useSidebarState`。新規 store なし | T3 でレビュー |
| I-3 API/D1/auth/Form 不変 | 変更は CSS 2 + component 3 のみ。`apps/api` 非接触 | `git diff --name-only` で apps/api 0 件 |
| I-4 token 経由 / HEX 禁止 | ドット色 `var(--ubm-color-accent-ink)`・border `var(--shell-bar-border)` 等のみ | `grep -n 'bg-\[#\|text-\[#\|#[0-9a-fA-F]\{6\}'` 差分 0 件 |
| I-5 browser API 入口 | listener は `browserDocument()` 経由。直接 `document` なし | `pnpm lint`（boundary lint）|
| I-6 hydration mismatch なし | footer 固定は CSS（height/overflow/margin-auto/flex）。`onToggle`/listener は mount 後のみ。初期 HTML 不変 | `SidebarShell.server.spec` 回帰 |
| I-7 観測契約属性維持 | `data-shell`/`data-shell-block`/`data-role`/`data-component`/`data-action` 削除なし。`sidebar-footer`/`nav-badge-dot` は additive | 既存 spec の属性アサーション GREEN |
| I-8 details ネイティブ挙動維持 | summary トグル・キーボード・`aria-haspopup` 維持。外側クリックは additive listener | TC-C3-05（summary 誤閉じ防止）|

### ローカル実行 / 検証コマンド

```bash
# 型
pnpm typecheck
# lint（document 直接参照 / HEX boundary 含む）
pnpm lint
# targeted vitest（リポジトリルートから）
pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx \
  apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx \
  apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx \
  apps/web/src/components/shell/__tests__/SidebarShell.server.spec.tsx \
  apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx \
  apps/web/src/components/public/__tests__/PublicFooter.spec.tsx \
  apps/web/app/(public)/layout.spec.tsx
# HEX 直書き検出（差分対象に対し 0 件）
grep -rn 'bg-\[#\|text-\[#\|#[0-9a-fA-F]\{6\}' \
  apps/web/src/components/shell apps/web/src/styles/globals.css apps/web/src/styles/legacy-public.css
```

## 参照資料

- phase-2-design.md（C1-C4 Before/After・`details.open` guard・lane）
- phase-3-design-review.md（MINOR TECH-M-01/02/03・リスク）
- phase-4-test-plan.md（TC-* ケース・GREEN 化対象）
- `apps/web/src/components/shell/SidebarShell.tsx` / `SidebarUserMenu.tsx` / `SidebarNavItem.tsx`
- `apps/web/src/lib/is-browser.ts`（`browserDocument()`）
- `apps/web/src/styles/globals.css`（1417 / 1547）/ `legacy-public.css`（716 / 1186）

## 実行手順（直列）

1. T1（C1）: globals.css 2 ブロック + SidebarShell aside 2 段化 → targeted vitest。
2. T4（C4）: SidebarShell main flex-column + legacy-public.css margin-auto → targeted vitest + PublicFooter/layout 回帰。
3. T2（C2）: SidebarNavItem 行 justify-center + badge ドット / SidebarUserMenu summary / AdminPublicReturn → targeted vitest。
4. T3（C3）: SidebarUserMenu effect（外側クリック / Escape）+ onToggle → targeted vitest。
5. 全 targeted vitest + typecheck + lint + HEX grep を通す。
6. DoD を満たしたら Phase 6（テスト追加）へ。

## 統合テスト連携

- `(public)/layout.spec` P-5 / `PublicFooter.spec` を T4 後に回帰確認。
- `SidebarShell.server.spec` で SSR HTML 不変（I-6）を確認。
- E2E visual（playwright-smoke）は既存 gate へ委譲。

## 多角的チェック観点（AIが判断）

- **責務境界**: レイアウト固定=CSS、開閉=`SidebarUserMenu` effect、collapse state=`useSidebarState`。混在させない。
- **回帰リスク**: `SidebarShell.tsx` / `SidebarUserMenu.tsx` が複数 concern → 直列実装 + concern 後 vitest で逐次封じ込め。
- **後方互換**: props / hook 戻り値 / DOM 観測契約すべて不変 or additive。

## サブタスク管理

| タスク | concern | ファイル | 検証 |
|--------|---------|---------|------|
| T1 | C1 | globals.css / SidebarShell.tsx(aside) | TC-C1-01〜06 |
| T4 | C4 | SidebarShell.tsx(main) / legacy-public.css | TC-C4-01/02 + P-5 回帰 |
| T2 | C2 | SidebarNavItem / SidebarUserMenu(summary) / SidebarShell(AdminPublicReturn) | TC-C2-01〜06 |
| T3 | C3 | SidebarUserMenu(effect) | TC-C3-01〜06 |

## 成果物

- `outputs/phase-5/implementation-plan.md`（本 Phase を正本とする実装手順サマリ）
- 修正ファイル一覧表 / concern 別 Before/After 差分 / I-1〜I-8 遵守チェック

## 完了条件

- [ ] 修正ファイル一覧（編集 5 + テスト 3 / 新規 0）どおりに変更した
- [ ] T1 globals.css 2 ブロック + aside 2 段化を実装し TC-C1-* GREEN
- [ ] T4 main flex-column + footer margin-auto を実装し TC-C4-* GREEN + P-5 回帰なし
- [ ] T2 collapsed justify-center + badge ドットを実装し TC-C2-* GREEN
- [ ] T3 外側クリック / Escape listener（browserDocument 経由）を実装し TC-C3-* GREEN
- [ ] `pnpm typecheck` / `pnpm lint` パス
- [ ] HEX 直書き grep 0 件（AC-5）
- [ ] I-1〜I-8 遵守チェック全項目を確認した

## タスク100%実行確認【必須】

- [ ] 全実行タスク（T1→T4→T2→T3）を直列で完了
- [ ] 必須成果物（実装手順）を本ファイルに記載
- [ ] DoD（ビルド/型/lint/test + AC-1〜6 手動確認）の手順を明記

### DoD（Definition of Done）

- [ ] targeted vitest 全 GREEN（C1-C4 新規 + 既存回帰なし）
- [ ] `pnpm typecheck` / `pnpm lint` パス
- [ ] HEX 直書き 0 件（`verify-design-tokens` 非抵触）
- [ ] AC-1: staging / local dev の admin `/` で nav が viewport 超過しても「公開サイトに戻る」/ user menu / collapse トグルが常時最下部・nav 領域のみスクロール
- [ ] AC-2: collapse 時 4rem 幅に全アイコンが収まり横はみ出しゼロ（badge はドット）
- [ ] AC-3: popover open 中に外側クリック / Escape で閉じる・route 変化 close 維持・内側 / summary では閉じない
- [ ] AC-4: 短コンテンツ公開ページで PublicFooter が viewport 最下部・長ページで末尾自然配置 + 余白保持

## 次Phase

[Phase 6: テスト追加](phase-6-test-additions.md)

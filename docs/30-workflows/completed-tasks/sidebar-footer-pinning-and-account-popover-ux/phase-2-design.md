# Phase 2: 設計

## メタ情報

| 項目 | 値 |
|------|----|
| task_id | sidebar-footer-pinning-and-account-popover-ux |
| phase | 2 / 13 |
| 名称 | 設計 |
| 前提 | Phase 1 完了（要件・inventory・AC 固定） |
| concern 数 | 4（C1〜C4）→ concern ごとにセクション分割（同一ファイル内） |

## 目的

C1〜C4 の修正方針を、**変更前 / 変更後のコード構造**・**状態所有権**・**CSS トークン**・**DOM 観測契約の維持点**まで確定し、Phase 4（テスト）/ Phase 5（実装）がそのまま着手できる設計正本を作る。lane 数は 3 以下、validation は直列で締める。

## 実行タスク

### 既存コンポーネント再利用可否（[FB-SDK-07-1]）

| 項目 | 判断 |
|------|------|
| 新規コンポーネント追加 | **不要**。既存 `SidebarShell` / `SidebarUserMenu` / `SidebarNavItem` の編集に閉じる |
| 新規 hook 追加 | **不要**。C3 の外側クリックは `SidebarUserMenu` 内 `useEffect` で完結（汎用 hook 化は未タスク候補） |
| 新規 CSS トークン追加 | **不要**。`--shell-bar-w-collapsed`（4rem）等の既存トークンで足りる |
| `browserDocument()` 再利用 | **要**。document アクセスの唯一入口（I-5） |

---

## C1 設計: sidebar フッター固定（AC-1）

### 真の論点

`<aside data-shell="sidebar">` が `min-height: 100vh`（**下限のみ**）で、nav 14 項目が viewport を超えると aside 全体が伸長し、`flex-1 overflow-y-auto` な nav の内部スクロールが発火しない。結果、aside 末尾（公開サイトに戻る + user menu + collapse トグル）が fold 下へ。

### 方針

1. **CSS**: `[data-shell="sidebar"]` を **高さ固定**へ。`min-height: 100vh` → `height: 100dvh`（`100dvh` でモバイル URL バー変動に追従。フォールバックに `height: 100vh` を直前行で併記）。`position: sticky; top: 0` は維持。`overflow: hidden`（C2 と共用）を追加。
2. **JSX（`SidebarShell.tsx` aside）**: aside を **2 段 flex** に再編する。
   - 上段（スクロール領域）: `SidebarBrand` + `SidebarNav`。nav は既存どおり `flex-1 overflow-y-auto`。Brand は `shrink-0`。
   - 下段（固定フッター領域）: `AdminPublicReturn`（admin のみ）+ `SidebarUserMenu` + `SidebarCollapseToggle` を 1 つの `<div data-shell-block="sidebar-footer" className="flex shrink-0 flex-col gap-3 pt-2">` に包む。`mt-auto` は不要（nav の flex-1 が残余高さを吸収するため footer は自然に最下部）。

### 変更後構造（`SidebarShell.tsx` の `sidebarContent` と aside）

```tsx
// sidebarContent を「スクロール部」と「固定footer部」に分離して返す
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
      <div className="flex justify-end">
        <SidebarCollapseToggle />
      </div>
    </div>
  </>
);
```

```tsx
// aside: height 固定 + overflow-hidden（CSS 側で height:100dvh を担うため、Tailwind では overflow と flex 構造のみ）
<aside
  data-shell="sidebar"
  data-collapsed={collapsed ? "true" : "false"}
  className="hidden w-[var(--shell-bar-w)] shrink-0 flex-col gap-3 overflow-hidden border-r border-[var(--shell-bar-border)] bg-[var(--shell-bar-bg)] p-3 data-[collapsed=true]:w-[var(--shell-bar-w-collapsed)] md:flex"
>
  {sidebarContent(collapsed)}
</aside>
```

> 注: 従来 aside 末尾にあった `<div className="mt-auto flex justify-end pt-2"><SidebarCollapseToggle /></div>` は撤去し、`sidebar-footer` ブロック内へ移設する。これにより drawer（モバイル）でも同じ footer 構造が共有される（`sidebarContent` を drawer も使用）。
>
> drawer 側（`SidebarDrawer`）は元々 `overflow-y-auto` で全体スクロールのため、footer 固定は不要（モバイルは drawer 全体が短く問題化しない）。`SidebarCollapseToggle` は `md:` 限定表示のため drawer 内では非表示のまま（既存挙動）。

### CSS 変更（`globals.css`、2 ブロック双方）

```css
/* 行 1417 付近 / 1547 付近の両方 */
[data-shell="sidebar"] {
  position: sticky;
  top: 0;
  height: 100vh;        /* fallback */
  height: 100dvh;       /* dynamic viewport（モバイル URL バー追従） */
  overflow: hidden;     /* collapse はみ出し抑止（C2）と内部スクロール委譲 */
  border-right: 1px solid var(--ubm-color-border-default);
  background: var(--ubm-color-surface-panel);
}
```

### 状態所有権 / 不変条件

- レイアウト固定は **CSS のみ**で達成（I-6: JS 計測なし）。`useSidebarState` の戻り値・props は不変（I-1）。
- `data-shell="sidebar"` 属性は維持。新規 `data-shell-block="sidebar-footer"` を追加（I-7 に反しない additive）。

---

## C2 設計: collapse 時はみ出し（AC-2）

### 真の論点

collapse 幅 4rem（64px）に対し、nav item / public-return / user-menu summary が `px-3`（左右計 24px）+ `gap-3`（12px）+ アイコン/アバターを **左寄せ**のまま描画し、はみ出した内容を aside がクリップしていない。badge（`<Chip>`）は collapsed でも内部 padding を持ち横へ溢れる。

### 方針

1. aside に `overflow-hidden`（C1 で追加済）→ 物理クリップの保険。
2. collapsed の各行（nav item / public-return / user-menu summary / collapse-toggle 行）を **`justify-center`** にして、アイコンのみを中央配置。テキスト・外部リンク矢印は既存どおり `sr-only`（NavItem は実装済、public-return も `sr-only` 済）。
3. **badge**: NavItem の `<Chip>` は collapsed では可視数値を出さずドット表示にする。collapsed 時は Chip を描画せず、`<span data-shell-block="nav-badge-dot" className="...dot..."><span className="sr-only">件数</span></span>` で小さな丸を出す（下記）。
4. collapse-toggle 行: 現状 `justify-end`。collapsed では中央寄せ（`data-[collapsed]` で出し分け or collapsed prop 伝播）。footer 化に伴い `flex justify-end` → expanded は `justify-end` / collapsed は `justify-center` とする。

### 変更後（`SidebarNavItem.tsx` content + 行クラス）

```tsx
// 行（Link / a）の className に collapsed 出し分けを追加（justify-center）
const rowBase =
  "flex items-center gap-3 rounded-sm px-3 py-2 text-sm ... ";
const rowLayout = collapsed ? "justify-center" : "";
// → className={`${rowBase} ${rowLayout}`}

// badge: collapsed はドット
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

> collapsed のドットを `absolute` で出すため、`<li>` または行要素を `relative` にする（`relative` を rowBase へ追加）。アクセシビリティ用に badge の件数は `sr-only` テキストで保持してよい（reviewer 判断 / Phase 3）。

### 変更後（`SidebarUserMenu.tsx` summary・`SidebarShell.tsx` AdminPublicReturn）

```tsx
// summary: collapsed は中央寄せ（アバターのみ）
className={`flex cursor-pointer list-none items-center gap-2 rounded-sm px-3 py-2 ${collapsed ? "justify-center" : ""} hover:bg-... focus-visible:outline ...`}

// AdminPublicReturn の Link: collapsed は justify-center
className={`flex items-center gap-3 rounded-sm px-3 py-2 text-sm ... ${collapsed ? "justify-center" : ""}`}
```

### UI コンポーネントの Props vs internal state（[VSCPKR-03]）

| コンポーネント | collapsed の供給源 | テスト操作 |
|----------------|-------------------|-----------|
| `SidebarNavItem` | **external prop** `collapsed` | props を変えて再レンダリング |
| `SidebarUserMenu` | **external prop** `collapsed` | props を変えて再レンダリング |
| `AdminPublicReturn`（SidebarShell 内） | **external prop** `collapsed` | SidebarShell の state（`useSidebarState`）を toggle、または collapsed 別レンダリング |

---

## C3 設計: アカウント popover 外側クリック / Escape 閉じ（AC-3）

### 真の論点

`SidebarUserMenu` はネイティブ `<details>`。`<details>` は **summary クリックでトグル**するが、**外側クリックでは閉じない**（ブラウザ標準仕様）。現状 close 契機は route 変化（`useEffect([pathname])`）のみ。Escape も未対応。

### 方針（additive・state owner は `<details>.open` のまま / I-2, I-8）

`detailsRef` を使い、document listener を追加する。handler 冒頭で `details.open` を確認し、閉じている時は no-op にする。

- `pointerdown`（マウス/タッチ統一）: クリック対象が `detailsRef.current` の外側なら `detailsRef.current.open = false`。
- `keydown`: `Escape` なら閉じる。
- React state は増やさず、open 正本を `<details>.open` に一本化する。

> 旧案の `isOpen` ミラーは撤回。最終実装は `<details>.open` のみを正本にする。

### 変更後（`SidebarUserMenu.tsx`）

```tsx
import { useEffect, useRef } from "react";
import { browserDocument } from "../../lib/is-browser";
// ...

export function SidebarUserMenu({ role, user, collapsed }: SidebarUserMenuProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  // ...

  // route 変化で自動 close（既存維持）
  useEffect(() => {
    if (detailsRef.current) detailsRef.current.open = false;
  }, [pathname]);

  // 外側クリック / Escape で close
  useEffect(() => {
    const doc = browserDocument();
    if (!doc) return;
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

  return (
    <details
      ref={detailsRef}
      data-shell-block="user-menu"
      className="group relative ..."
    >
      {/* summary / popover は既存どおり（summary に collapsed justify-center を追加） */}
    </details>
  );
}
```

### 設計上の注意

- `pointerdown` を使う理由: `click` だと popover 内リンク（`<Link>`）の遷移と競合しうる。`pointerdown` + `contains` 判定で「外側の押下」のみ捕捉。popover 内リンククリックは route 変化 effect が close を担う（既存）。
- summary クリックで開くと `onToggle` → `details.open=true` → listener 登録。再度 summary クリックで閉じると `onToggle` → `details.open=false` → listener 解除。**summary 自身のクリックは `el.contains(target)` が true** なので外側判定で誤閉じしない。
- SSR/Workers では `browserDocument()` が `undefined` を返し no-op（I-5）。

---

## C4 設計: main footer sticky（AC-4）

### 真の論点

`PublicFooter` は `(public)/layout.tsx` でのみ `children` 末尾に描画。`[data-component="public-footer"]` は `margin-top: 40px` 固定で、`<main data-shell="main">` が `flex-1`（縦 flex でない）のため、短コンテンツページで footer が viewport 最下部へ張り付かない。

### 方針

1. **JSX（`SidebarShell.tsx` `<main>`）**: `<main>` を縦 flex 化。`className="min-w-0 flex-1"` → `className="flex min-w-0 flex-1 flex-col"`。
2. **CSS（`legacy-public.css`）**: `[data-component="public-footer"]` の `margin-top: 40px` → `margin-top: auto`。これで `<main>`（flex column, 親 `min-h-screen` の flex-1 で viewport 高さを満たす）の中で footer が下端へ。footer 自身の `padding: 32px 28px`（上 32px）が breathing room を保持するため余白消失なし。
3. 長コンテンツページ: `margin-top: auto` は余剰スペースがなければ 0 に解決 → footer は content 直後 + 上 padding 32px。視覚的余白は維持（AC-4 後段）。

### 変更後

```tsx
// SidebarShell.tsx
<main
  data-shell="main"
  data-route={routeKey}
  {...(sectionRhythm ? { "data-section-rhythm": sectionRhythm } : {})}
  className="flex min-w-0 flex-1 flex-col"
>
  {children}
</main>
```

```css
/* legacy-public.css 行 716 付近 */
[data-component="public-footer"] {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 32px 28px;
  margin-top: auto;   /* was: 40px — sticky footer 化 */
  border-top: 1px solid var(--ubm-color-border-default);
  color: var(--ubm-color-text-secondary);
  font-size: 12px;
}
```

> 影響範囲: `<main>` flex-column 化は admin layout（footer なし）でも安全（children が `flex min-w-0 flex-1 flex-col gap-4 p-4` の単一 wrapper のため、flex-column 親でも縦積み挙動不変）。member layout も同様に検証する（Phase 9）。

---

## lane 設計（Phase 5 実装の並列単位 / 3 以下）

| lane | concern | ファイル | 競合 |
|------|---------|---------|------|
| lane-1 | C1 + C4 | `globals.css` / `SidebarShell.tsx`（aside + main）/ `legacy-public.css` | SidebarShell.tsx を C2 と共有 → 直列推奨 |
| lane-2 | C2 | `SidebarNavItem.tsx` / `SidebarShell.tsx`（AdminPublicReturn）/ `SidebarUserMenu.tsx`（summary） | SidebarShell.tsx / SidebarUserMenu.tsx を共有 |
| lane-3 | C3 | `SidebarUserMenu.tsx`（effect） | SidebarUserMenu.tsx を lane-2 と共有 |

> `SidebarShell.tsx` と `SidebarUserMenu.tsx` が複数 concern にまたがるため、**Phase 5 実装は直列**（lane 並列でなく concern 順 C1→C4→C2→C3）が安全。設計（本 Phase）と仕様分割（Phase 4-13 文書）は並列可。

## validation matrix（Phase 9 で実行）

| command | 目的 |
|---------|------|
| `pnpm exec vitest run --root=. --config=vitest.config.ts <targeted spec 群>` | C1-C4 component 契約 + 回帰 |
| `pnpm typecheck` | 型整合 |
| `pnpm lint` | ESLint（`document` 直接参照禁止含む）|
| `grep -rn 'bg-\[#\|text-\[#\|#[0-9a-fA-F]\{6\}' apps/web/src/components/shell apps/web/src/styles/(差分)` | HEX 直書き 0 件（AC-5） |

## 参照資料

- Phase 1（inventory / AC / 命名規則）
- `apps/web/src/lib/is-browser.ts`（`browserDocument()`）
- `apps/web/src/components/ui/Chip.tsx`（badge collapsed バリアント検討）
- aiworkflow-requirements: `ui-ux-*.md`（shell 観測契約）

## 実行手順

1. C1〜C4 の Before/After 構造を確定（完了）。
2. state owner（popover=`<details>.open`、collapse=`useSidebarState`）を明記（完了）。
3. lane / validation matrix を定義（完了）。
4. Phase 3 設計レビューへ。

## 統合テスト連携

- `(public)/layout.spec.tsx` P-5 を壊さない（footer は shell 配下のまま）。
- 新規 component spec が C1（footer 領域 DOM）/ C2（collapsed 構造）/ C3（開閉）/ C4（main flex-column）を保護する設計（Phase 4 で具体化）。

## 多角的チェック観点（AIが判断）

- **責務境界**: レイアウト固定=CSS、開閉ロジック=`SidebarUserMenu`、collapse state=`useSidebarState`。混在させない。
- **依存関係**: `SidebarShell.tsx` / `SidebarUserMenu.tsx` が複数 concern に触れるため実装直列化で回帰リスク低減。
- **後方互換**: public props / hook 戻り値 / DOM 観測契約属性すべて不変 or additive。

## サブタスク管理

| concern | 設計確定 | Phase 4 テスト設計担当 |
|---------|---------|----------------------|
| C1 | ✅ | SidebarShell.spec（footer 領域）|
| C2 | ✅ | SidebarNavItem.spec / SidebarShell.spec |
| C3 | ✅ | SidebarUserMenu.spec |
| C4 | ✅ | SidebarShell.spec（main flex-column）|

## 成果物

- `outputs/phase-2/design.md`（本 Phase を正本とする設計サマリ）
- C1-C4 Before/After コード設計（本ファイル）

## 完了条件

- [x] C1-C4 の変更後コード構造を確定した
- [x] state 所有権（`<details>.open` 正本）を明記した
- [x] `browserDocument()` 経由の listener 設計を確定した（I-5 遵守）
- [x] CSS 変更（height:100dvh / overflow / margin:auto）を確定した
- [x] lane / validation matrix を定義した
- [x] 既存 DOM 観測契約属性の維持を確認した（I-7）

## タスク100%実行確認【必須】

- [x] 全実行タスクを完了
- [x] 設計成果物を本ファイルに記載
- [x] Phase 3 開始条件を満たす

## 次Phase

[Phase 3: 設計レビュー](phase-3-design-review.md)

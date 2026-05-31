# Phase 5 — 実装（GREEN）

Phase 4 の RED テストを通すための実装手順と、本サイクルで適用した実装結果を記述する。Phase 2 のシグネチャを正本とし矛盾させない。

## 変更ファイル一覧（FB-RT-03）

### 新規作成

| パス | 役割 |
|------|------|
| `apps/web/src/components/shell/SidebarMobileTrigger.tsx` | hamburger button（context 消費・`md:hidden`） |
| `apps/web/src/components/shell/SidebarDrawer.tsx` | overlay dialog（Esc/backdrop/focus/scroll lock） |
| `apps/web/src/components/shell/__tests__/SidebarMobileTrigger.spec.tsx` | Phase 4 T-MT-* |
| `apps/web/src/components/shell/__tests__/SidebarDrawer.spec.tsx` | Phase 4 T-DR-* |

### 修正

| パス | 修正内容 |
|------|----------|
| `apps/web/src/components/shell/useSidebarState.ts` | `usePathname()` で route-close / `readInitialCollapsed()` に md 初期 collapsed の matchMedia 分岐を追記 |
| `apps/web/src/components/shell/SidebarShell.tsx` | mobile strip に `SidebarMobileTrigger`、`SidebarDrawer` を mount（children = brand+nav+footer 同ツリー） |
| `apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx` | `next/navigation` mock + matchMedia mock + T-SS-6..10 追加 |
| `apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx` | `next/navigation` mock + T-SH-1/2 追加 |
| `apps/web/src/lib/is-browser.ts` | `browserMatchMedia()` 追加 |
| `apps/web/src/styles/globals.css` | `body[data-shell-drawer-open="true"]` scroll lock 追加 |

---

## 実装ステップ

### ステップ 1: `SidebarMobileTrigger.tsx`（新規）

Phase 2 §1 のシグネチャに従う。

1. `"use client"` 宣言。
2. `useSidebarShellContext()` から `drawerOpen` / `setDrawerOpen` を取得。
3. hamburger `<button type="button">` を返す:
   - `data-component="shell-mobile-trigger-button"`
   - `aria-label="メニューを開く"` / `aria-controls="shell-drawer"` / `aria-expanded={drawerOpen}`
   - `onClick={() => setDrawerOpen(true)}`
   - `className` に `md:hidden` を含む（`>=768px` 非表示）。色は `text-[var(--ubm-color-text-primary)]`。
4. 内部のアイコンは `aria-hidden`。追加依存を避け、button 内に 3 本線の span を置く（新規 primitive 化しない）。

### ステップ 2: `SidebarDrawer.tsx`（新規）

Phase 2 §2 のシグネチャに従う。

1. `"use client"` 宣言。`useEffect` / `useRef` / `browserDocument`（`@/lib/is-browser`）を import。
2. props: `{ open: boolean; onClose: () => void; children: ReactNode }`。
3. `panelRef = useRef<HTMLDivElement | null>(null)`。
4. **body scroll lock（AC-6）**: `useEffect([open])` で `browserDocument()` を取得（undefined なら return）。`open` で `body.setAttribute("data-shell-drawer-open","true")`、else `removeAttribute`。cleanup でも `removeAttribute`（INV-3: 直接 `document` を書かず `browserDocument()` 経由）。
5. **initial focus（AC-7）**: `useEffect([open])`、`open` 時に `panelRef.current?.querySelector<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')?.focus()`。
6. **Esc close（AC-4）**: `useEffect([open, onClose])`、`open` 時のみ `browserDocument()` に `keydown` listener を登録し `e.key === "Escape"` で `onClose()`。cleanup で `removeEventListener`（open=false では listener 非登録）。
7. `if (!open) return null;`（AC-3: open=false で null）。
8. open=true の JSX:
   - overlay wrapper `[data-component="shell-drawer-overlay"]` に `fixed inset-0 z-50 md:hidden`。
   - backdrop `[data-component="shell-drawer-backdrop"]`: `onClick={onClose}` / `aria-hidden="true"` / scrim 背景（下記 INV-2）。
   - panel `[data-component="shell-drawer-panel"]`: `ref={panelRef}` / `id="shell-drawer"` / `role="dialog"` / `aria-modal="true"` / `aria-label="ナビゲーション"`、`w-[var(--shell-bar-w)]` / `bg-[var(--shell-bar-bg)]`。

### ステップ 3: `useSidebarState.ts`（編集）

Phase 2 §3 に従う。

1. `import { usePathname } from "next/navigation";` を追加。
2. `readInitialCollapsed()` を拡張:
   - 既存どおり `getBrowserStorage()` の `STORAGE_KEY` を最優先（`raw !== null` なら `JSON.parse(raw) === true` を返す）。
   - localStorage 未設定（`raw === null` または storage 不在）時のみ matchMedia 判定へ:
     - `if (!isBrowser()) return false;`（SSR / Workers は expanded = INV-5）。
     - `try { const mdUp = window.matchMedia("(min-width: 768px)").matches; const lgUp = window.matchMedia("(min-width: 1024px)").matches; return mdUp && !lgUp; } catch { return false; }`
   - **INV-3 対応**: `window.matchMedia` は `is-browser.ts` の getter に無い。`isBrowser()` ガード後に **scoped `// eslint-disable-next-line no-restricted-globals` を当該 1 行のみに限定付与**（既存 `getBrowserStorage()` の `"local" + "Storage"` 回避と同方針。広域 disable / file 先頭 disable は禁止）。matchMedia は md 初期判定の 1 関数内に閉じる（INV-5: matchMedia 参照は 1 点のみ）。
3. route auto-close（AC-5）: hook 本体に `const pathname = usePathname();` と `useEffect(() => { setDrawerOpenState(false); }, [pathname]);` を追加。
   - 初回 mount でも effect は走るが `drawerOpen` 初期値は `false` のため無害。同一 route の再 render（依存値不変）では effect 再実行されず close が走らない（T-SS-10）。

### ステップ 4: `SidebarShell.tsx`（編集）

Phase 2 §4 に従う。

1. `import { SidebarMobileTrigger } from "./SidebarMobileTrigger";` と `import { SidebarDrawer } from "./SidebarDrawer";` を追加。
2. 既存 mobile strip（`[data-component="shell-mobile-trigger"]`, `md:hidden`）内に `<SidebarMobileTrigger />` を `{mobileTriggerSlot}` の前に配置（`mobileTriggerSlot` prop は後方互換で維持 = Issue 最適化 4）。
3. `<SidebarDrawer open={state.drawerOpen} onClose={() => state.setDrawerOpen(false)}>` を provider 内に mount。children は `<aside>` と同じツリー:
   - `<SidebarBrand mode={state.mode} />`
   - `<SidebarNav navGroups={navGroups} pathname={activePath} mode={state.mode} />`
   - footer: `{userMenuSlot ?? (user ? <DefaultUserChip user={user} mode={state.mode} /> : null)}`
   - drawer 内は常に展開表示が自然。Phase 8 で `SidebarBody` helper 抽出を検討したが、drawer/aside 固有要素の差が大きいため不採用。
4. `<aside>` の `hidden md:flex` は維持（`<768px` で sidebar hidden）。

### ステップ 5: 既存 spec への mock 追加（RED → GREEN の前提整備）

1. `useSidebarState.spec.tsx`: Phase 4 §3 の `next/navigation` mock（`pathnameRef` 経由）と matchMedia mock（`Object.defineProperty`）を追加。既存 5 ケースは matchMedia を lg 設定にして expanded 期待を維持。T-SS-6..10 を追加。
2. `SidebarShell.spec.tsx`: `useSidebarState` 経由で `usePathname` が呼ばれるため `next/navigation` mock を追加。T-SH-1/2 を追加。

---

## INV-2 対応: scrim 色トークン

- 実装では新規 token を増やさず、backdrop 専用 button に `bg-[var(--ubm-color-text-primary)] opacity-40` を適用した。drawer panel は別 sibling で描画し、opacity が子要素へ伝播しない構造にした。
- `bg-[#xxx]` / inline style での色直書きは禁止。
- 影（panel の `shadow-lg`）は既存 `--ubm-shadow-lg` を利用する Tailwind `shadow-lg` で可（色トークン対象外）。

---

## ローカル実行コマンド（targeted）

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__/SidebarMobileTrigger.spec.tsx \
  apps/web/src/components/shell/__tests__/SidebarDrawer.spec.tsx \
  apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx \
  apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx
```

型 / lint:

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 完了条件

- [ ] 新規 / 修正ファイルパス一覧を記載（FB-RT-03）
- [ ] Phase 2 のシグネチャを実装手順に落とし矛盾なし
- [ ] INV-3: matchMedia / document 参照を `isBrowser()` ガード + `browserDocument()` 経由 + scoped 1 行 eslint-disable に限定する手順を明記
- [ ] INV-2: scrim はトークン追加（OKLch）で対応し HEX 直書きしない手順を明記（`--ubm-color-overlay-scrim` 未存在の fallback 含む）
- [ ] INV-5: matchMedia 参照は md 初期判定 1 点のみ・SSR 非参照
- [ ] mobileTriggerSlot prop の後方互換維持を明記
- [ ] 既存 spec への mock 追加を実装ステップに含める
- [ ] ローカル実行コマンドを記載

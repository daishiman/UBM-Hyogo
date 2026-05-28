# Task E — Mobile / Tablet 用 drawer と responsive 挙動

[実装区分: 実装仕様書]

## 目的

`< md` breakpoint で sidebar を hidden にし、左上の hamburger trigger から
overlay drawer として表示する。タブレット（`md ~ lg`）では sidebar を**初期 collapsed** とする。

## 前提

- Task A の `useSidebarState` で `drawerOpen` state が利用可能

## 変更対象ファイル

### 新規

- `apps/web/src/components/shell/SidebarMobileTrigger.tsx` (Client)
- `apps/web/src/components/shell/SidebarDrawer.tsx` (Client)
- `apps/web/src/components/shell/__tests__/SidebarDrawer.spec.tsx`
- `apps/web/src/components/shell/__tests__/SidebarMobileTrigger.spec.tsx`

### 編集

- `apps/web/src/components/shell/SidebarShell.tsx`: drawer をマウント、`< md` で `<aside>` を hidden 化
- `apps/web/src/components/shell/useSidebarState.ts`: route 変化で drawer 自動 close、初期 collapsed 判定（`md`〜`lg` のみ）

## シグネチャ

```tsx
// SidebarMobileTrigger.tsx
export function SidebarMobileTrigger(): JSX.Element
// hamburger button、md+ では hidden、SidebarShellContext 経由で drawerOpen=true
```

```tsx
// SidebarDrawer.tsx
export type SidebarDrawerProps = {
  open: boolean
  onClose: () => void
  children: ReactNode // sidebar 本体（brand + nav + UserMenu）と同じツリーを渡す
}
export function SidebarDrawer(props: SidebarDrawerProps): JSX.Element
// role="dialog" aria-modal="true"、backdrop クリック / Esc で close、focus trap
```

## responsive 仕様

| viewport | sidebar | drawer | hamburger |
|---------|--------|--------|-----------|
| `< 768px` (sm) | hidden | available | visible (上部 56px ストリップ) |
| `768〜1023px` (md) | visible（初期 collapsed） | unmounted | hidden |
| `>= 1024px` (lg) | visible（初期 expanded、localStorage 優先） | unmounted | hidden |

- breakpoint 判定は CSS のみ（`md:` Tailwind）。JS の matchMedia には依存しない
- drawer は CSS で `md:hidden` を付与し、sidebar には `hidden md:flex` を付与
- 初期 collapsed（md のみ）: 初回マウント時に viewport を判定するため `useSidebarState` で `window.matchMedia('(min-width: 1024px)')` を 1 回だけ参照（SSR では参照しない）

## route change 時の drawer 自動 close

```ts
// useSidebarState 内
useEffect(() => {
  setDrawerOpen(false)
}, [pathname])
```

`usePathname()` を import して watch する。

## focus trap / a11y

- drawer open 時に `<body>` へ `data-shell-drawer-open="true"` を付与（CSS で scroll lock）
- 初期 focus を drawer 内の最初のリンクへ
- Esc キーで close
- backdrop クリックで close

## テスト

| ファイル | ケース |
|---------|------|
| `SidebarMobileTrigger.spec.tsx` | クリックで context の `setDrawerOpen(true)` が呼ばれる / `md+` で `hidden` クラス |
| `SidebarDrawer.spec.tsx` | open=true で `role="dialog"` 表示、Esc で `onClose`、backdrop click で `onClose`、route change で auto-close |

## ローカル実行

```bash
mise exec -- pnpm --filter @ubm/web test --run src/components/shell/__tests__/SidebarDrawer
mise exec -- pnpm --filter @ubm/web test --run src/components/shell/__tests__/SidebarMobileTrigger
# 手動: DevTools で 375px / 768px / 1280px に切り替えて確認
```

## DoD

1. spec green
2. 375 / 768 / 1280 px で期待挙動（手動確認、Task F の playwright spec で自動化）
3. drawer open 時に背景 scroll が止まる
4. drawer 内のリンククリック → 自動 close + 遷移

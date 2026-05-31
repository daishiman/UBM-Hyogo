# Phase 5: 実装

**[実装区分: 実装仕様書]**

## 変更対象ファイル

| # | パス | 種別 | 規模 |
|---|------|------|------|
| 1 | `apps/web/src/components/layout/AdminSidebar.tsx` | 編集 | 中（GROUPS 削除 1 行 / JSX 追加 ~10 行） |
| 2 | `apps/web/src/components/layout/__tests__/AdminSidebar.spec.tsx` | 編集 | 中（追加 ~30 行） |

## 関数・型シグネチャ

`AdminSidebar` の public signature は **変更しない**:

```ts
export interface AdminSidebarProps {
  readonly schemaDiffCount: number;
  readonly userDisplayName: string;
  readonly userEmail: string;
}
export function AdminSidebar(props: AdminSidebarProps): JSX.Element;
```

`AdminSidebarNavItem` の signature も **変更しない**（案 B 採用のため）。

## 編集差分（AdminSidebar.tsx）

### 差分 1: `GROUPS` の Public セクションから `/` を削除

```diff
 const GROUPS: ReadonlyArray<NavGroupDef> = [
   {
     label: "Public",
     items: [
-      { href: "/", label: "ホーム", icon: ICON_HOME },
       { href: "/members", label: "会員ディレクトリ", icon: ICON_USERS },
       { href: "/register", label: "登録", icon: ICON_USER_PLUS },
     ],
   },
```

### 差分 2: JSX 内 footer の **直前** に「公開サイトに戻る」anchor を追加

`<footer data-component="admin-sidebar-footer">` の直前に挿入:

```tsx
<a
  href="/"
  data-role="public-return"
  data-component="admin-sidebar-public-return"
  aria-label="公開サイトに戻る"
  className="admin-sidebar-public-return mx-1 mt-2 flex items-center gap-2 rounded px-3 py-2 text-sm text-[color:var(--ubm-color-text-secondary)] transition-colors hover:bg-[color:var(--ubm-color-surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--ubm-color-accent)]"
>
  <span aria-hidden>{ICON_HOME}</span>
  <span>公開サイトに戻る</span>
</a>
```

## 入出力・副作用

- 入力: `AdminSidebarProps`（変更なし）
- 出力: JSX。DOM 上に `data-role="public-return"` の anchor が 1 つ追加される
- 副作用: なし（純粋 render）
- ネットワーク: クリック時 `href="/"` で full reload。`router.push` 等のクライアント遷移は行わない

## エラーハンドリング

- 該当 anchor は static markup のため runtime 例外経路なし
- `userDisplayName` / `userEmail` の空文字フォールバック（既存ロジック `userDisplayName || userEmail || "管理者"`）を継承

## 実装手順

1. `apps/web/src/components/layout/AdminSidebar.tsx` を開く
2. 差分 1 を適用（行 52 の `{ href: "/", label: "ホーム", ... }` を削除）
3. 差分 2 を適用（`<footer data-component="admin-sidebar-footer">` 直前に anchor を追加）
4. `mise exec -- pnpm typecheck` を実行し型エラーが無いことを確認
5. `mise exec -- pnpm lint` を実行し lint エラーが無いことを確認
6. `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/components/layout/__tests__/AdminSidebar.spec.tsx` を実行（Phase 6 で spec を更新するまでは既存 T10「ホーム」関連 assertion が落ちる可能性あり → Phase 6 で同 wave 修正）

## ローカル実行コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  src/components/layout/__tests__/AdminSidebar.spec.tsx
```

## DoD（Phase 5 単独）

- [ ] AdminSidebar.tsx に差分 1 / 2 が適用されている
- [ ] `rg -n 'data-role="public-return"' apps/web/src/components/layout/AdminSidebar.tsx` で 1 件ヒット
- [ ] `rg -n 'label: "ホーム"' apps/web/src/components/layout/AdminSidebar.tsx` で 0 件
- [ ] `rg "#[0-9a-fA-F]{3,6}" apps/web/src/components/layout/AdminSidebar.tsx` で 0 件（HEX 不在）
- [ ] typecheck / lint green

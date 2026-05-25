# Phase 4 — テスト計画

## 4.1 追加テスト

### `apps/web/src/features/admin/components/_layout/__tests__/AdminTopbarActions.spec.tsx`（新規）

| Test case | Assert |
|-----------|--------|
| TC-1: ログアウト button 存在 | `getByRole("button", { name: "ログアウト" })` が 1 つ存在 |
| TC-2: 責務境界回帰防止 | 「新規追加」「タグ作成」「保存」等ページ固有操作ラベルを含む button が存在しない |
| TC-3: トークン遵守 | wrapper className に `bg-[#` / `text-[#` の arbitrary color パターンが含まれない |
| TC-4: a11y wrapper | root が `data-testid="admin-topbar-actions-island"` を持つ |

## 4.2 既存テスト（無修正で pass を確認）

| spec | 検証点 |
|------|--------|
| `apps/web/app/(admin)/layout.spec.tsx` | `data-theme="cool"` / `data-route-group="admin"` / `data-shell="sidebar"` / `data-shell="topbar"` / `data-route="admin"` 契約 |
| `apps/web/src/components/layout/__tests__/AdminTopbar.spec.tsx` | breadcrumb / actions slot 契約、`aria-hidden` 条件 |
| `apps/web/src/components/auth/__tests__/SignOutButton.spec.tsx`（存在する場合） | signOut 呼び出し / accessible name |

## 4.3 統合 assert（layout 注入後）

`(admin)/layout.spec.tsx` で以下を追加 assert（既存契約を壊さない範囲で）:

- AdminTopbar 内部 `data-component="admin-topbar-actions"` 要素が `aria-hidden` 属性を持たない（注入で解除）
- 同要素内に accessible name 付き button が 1 つ以上存在

> ただし既存 spec が無修正で pass することを優先する。追加 assert は既存と衝突しない場合のみ。衝突するなら `AdminTopbarActions.spec.tsx` 側でのみ検証する。

## 4.4 a11y / visual

- `axe` critical violation 0 を維持
- visual smoke は admin 配下が visual baseline 対象に含まれる場合のみ実行。差分は「topbar 右側に ghost button 1 個」のみで意味的に正しい差分

## 4.5 テスト実行コマンド

```bash
mise exec -- pnpm exec vitest run apps/web/src/features/admin/components/_layout/__tests__/AdminTopbarActions.spec.tsx
mise exec -- pnpm --dir apps/web exec vitest run "app/(admin)/layout.spec.tsx"
mise exec -- pnpm exec vitest run apps/web/src/components/layout/__tests__/AdminTopbar.spec.tsx
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

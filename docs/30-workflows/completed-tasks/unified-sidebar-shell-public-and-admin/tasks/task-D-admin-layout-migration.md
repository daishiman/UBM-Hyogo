# Task D — Admin layout を SidebarShell へ移行（既存 AdminSidebar を削除）

[実装区分: 実装仕様書]

## 目的

`apps/web/app/(admin)/layout.tsx` を `SidebarShellServer` ベースに置き換え、
既存 `AdminSidebar` を削除する。admin 専用挙動（gate / schemaDiff badge）は
shell 内部に移譲済みのため、layout の責務は guard + shell 呼び出しのみになる。

## 前提

- Task A 完成（SidebarShellServer が admin role と schemaDiffCount を扱う）
- Task B 完成（admin role の UserMenu が「管理者ダッシュボード」「プロフィール」「編集申請」「ログアウト」を出す）

## 変更対象ファイル

### 編集

- `apps/web/app/(admin)/layout.tsx`

### 削除

- `apps/web/src/components/layout/AdminSidebar.tsx`
- `apps/web/src/components/layout/AdminSidebar.spec.tsx`（存在する場合）
- 上記の参照（grep で 0 件にする）

## 実装スケッチ

```tsx
// apps/web/app/(admin)/layout.tsx
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getSession } from '@/lib/session'
import { SidebarShellServer } from '@/components/shell/SidebarShell.server'
import { SidebarMobileTrigger } from '@/components/shell/SidebarMobileTrigger'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!session.isAdmin) redirect('/login?gate=forbidden')

  const pathname = (await headers()).get('x-pathname') ?? '/admin'

  return (
    <div data-theme="cool" data-route-group="admin" data-shell-mode="sidebar">
      <SidebarShellServer
        activePath={pathname}
        mobileTriggerSlot={<SidebarMobileTrigger />}
      >
        {children}
      </SidebarShellServer>
    </div>
  )
}
```

旧 `AdminSidebar` が持っていた以下の責務はすべて `SidebarShellServer` 側に集約済み:

| 旧責務 | 新所在 |
|-------|--------|
| nav 3 グループ + 13 item（Public 3 + Members 1 + Admin 9） | `shell-config.ts#buildNavForRole('admin')` |
| schemaDiff badge | `SidebarShellServer` 内で `getSchemaDiffCount()` を渡す |
| 左下ユーザーチップ | `SidebarUserMenu`（Task B） |
| SignOut | `SidebarUserMenu` 内に embed |

## schemaDiffCount の取得

- `apps/web/src/features/admin/schema-diff/get-schema-diff-count.ts`（既存ロジック）を `SidebarShellServer` から呼ぶ
- 失敗時は count=0 で badge 非表示（既存挙動と一致）

## テスト

| ファイル | ケース |
|---------|------|
| `apps/web/app/(admin)/__tests__/layout.spec.tsx` | (1) session=null で `/login` redirect (2) isAdmin=false で `/login?gate=forbidden` (3) admin で SidebarShell が描画 + admin グループ 9 item / total 13 item 表示 (4) schemaDiffCount=3 で warn badge |

regression: 旧 `AdminSidebar` の spec が存在した場合は削除（新 spec が cover）。

## ローカル実行

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/app/\(admin\)
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 手動: admin アカウントで /admin → 既存 nav と同じ Admin group 9 item / total 13 item が出ることを目視
mise exec -- pnpm --filter @ubm-hyogo/web dev
```

## DoD

1. `git grep -l "components/layout/AdminSidebar"` ヒット 0
2. `apps/web/app/(admin)/__tests__/layout.spec.tsx` の 4 ケース green
3. `pnpm typecheck && pnpm lint && pnpm --filter @ubm-hyogo/web test --run` green
4. `/admin` 配下 9 route で sidebar に admin 9 item / total 13 item が描画される
5. admin 以外のロールで `/admin` を直叩きすると `/login?gate=forbidden` へ redirect される（不変条件）

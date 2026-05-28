# Task C — 公開 / 会員 layout を SidebarShell へ統合

[実装区分: 実装仕様書]

## 目的

`/` 系（公開 6 route）と `/profile` 系（会員 2 route）を `SidebarShell` に切替え、
旧 `PublicHeader*` および `MemberHeader` を削除する。

## 前提

- Task A の `SidebarShell.server.tsx` / `SidebarShell.tsx` 完成
- Task B の `SidebarUserMenu` 完成
- Task E の `SidebarMobileTrigger` 完成

## 変更対象ファイル

### 編集

- `apps/web/app/(public)/layout.tsx`
- `apps/web/app/(member)/layout.tsx`

### 削除

- `apps/web/src/components/public/PublicHeader.tsx`
- `apps/web/src/components/public/SessionAwarePublicHeader.tsx`
- `apps/web/src/components/public/PublicHeaderWithPath.tsx`
- `apps/web/src/components/layout/MemberHeader.tsx`
- これらの import を持つ全ての参照箇所

### 保持

- `apps/web/src/components/public/PublicFooter.tsx`（footer は維持）

## 実装スケッチ

```tsx
// apps/web/app/(public)/layout.tsx
import { SidebarShellServer } from '@/components/shell/SidebarShell.server'
import { SidebarUserMenu } from '@/components/shell/SidebarUserMenu'
import { SidebarMobileTrigger } from '@/components/shell/SidebarMobileTrigger'
import { PublicFooter } from '@/components/public/PublicFooter'
import { headers } from 'next/headers'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get('x-pathname') ?? '/'
  return (
    <div data-theme="warm" data-route-group="public" data-shell-mode="sidebar">
      <SidebarShellServer
        activePath={pathname}
        mobileTriggerSlot={<SidebarMobileTrigger />}
      >
        {children}
        <PublicFooter />
      </SidebarShellServer>
    </div>
  )
}
```

`SidebarShellServer` 内で `getSession()` 結果に基づき `<SidebarUserMenu role={...} user={...} />`
を組み立てて自身で挿入する形にする（呼出側で role 判定を再実装しない）。

`(member)/layout.tsx` も同様（`data-theme="warm" data-route-group="member"`）。
admin 権限を持つユーザーが `/profile` を見たときは sidebar に ADMIN グループも表示される
（role=admin が選ばれるため、Phase 2 仕様通り）。

## 削除手順

1. `git grep -l "PublicHeader\|SessionAwarePublicHeader\|PublicHeaderWithPath\|MemberHeader"` で
   参照箇所を洗い出す
2. 全ての import 行を除去
3. ファイル本体を削除
4. `pnpm typecheck` で参照漏れ 0 を確認

## テスト

| ケース | 期待値 |
|-------|------|
| `(public)/layout` SSR、未ログイン | sidebar に PUBLIC グループのみ、UserMenu に「ログイン」のみ |
| `(public)/layout` SSR、member ログイン | sidebar に PUBLIC + MEMBERS、UserMenu に 「プロフィール / 編集申請 / ログアウト」 |
| `(public)/layout` SSR、admin ログイン | sidebar に PUBLIC + MEMBERS + ADMIN（schemaDiff badge 付き）|
| 旧 component が import されていない | `git grep "PublicHeader"` がヒット 0（テストや本ドキュメント以外） |

unit テストは `__tests__/(public)-layout.spec.tsx` / `__tests__/(member)-layout.spec.tsx` 新規。
`vi.mock('next/headers')` + `vi.mock('@/lib/session')` でセッションを差し替える。

## ローカル実行

```bash
mise exec -- pnpm --filter @ubm/web test --run src/app
mise exec -- pnpm typecheck
mise exec -- pnpm lint
# 手動確認
mise exec -- pnpm --filter @ubm/web dev
# → http://localhost:3000/ で sidebar 表示、/profile でも同 sidebar
```

## DoD

1. `/` `/members` `/register` `/privacy` `/terms` `/login` `/profile` の 7 route で同一 sidebar が描画
2. 旧 4 component が grep ヒット 0
3. `pnpm typecheck && pnpm lint && pnpm --filter @ubm/web test --run` green
4. ログイン → /profile → /admin の遷移で sidebar が**継続表示**される（visual flash なし）

# Phase 9: QA

## Local gates

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm/web test --run src/components/shell/__tests__/SidebarUserMenu
mise exec -- pnpm --filter @ubm/web test --run src/components/shell/__tests__/user-menu-config
```

## Manual smoke（local）

| ロール | 確認 |
| --- | --- |
| viewer (未ログイン) | アバター押下 → 「ログイン」のみ表示、`/login` へ遷移 |
| member | プロフィール / プロフィール編集申請 / ログアウトの 3 件、各 link で popover 自動 close |
| admin | 4 件、avatar 右下に admin badge dot、`/admin` 遷移可能、`signOut` で `/login` redirect |

## Visual gates

本 task 単体では visual baseline を生成しない。親 Task F の `sidebar-shell-visual.spec.ts` における user menu open/closed snapshot を runtime gate とする。macOS 生成 PNG は commit 対象にしない。

## 完了条件

local gates が green、manual smoke 3 ロールの DOM contract が一致、Phase 11 inventory に `present` / `pending` が正しく反映される。

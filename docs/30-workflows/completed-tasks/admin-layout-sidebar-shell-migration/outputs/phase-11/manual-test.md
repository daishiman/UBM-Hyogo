# Phase 11: manual test / visual evidence — admin-layout-sidebar-shell-migration

区分: VISUAL。本タスクは admin shell の見た目が変わるため visual evidence セット対象。

## 自動検証で担保済み（screenshot 不要の回帰）

| 観点 | 担保 spec |
| --- | --- |
| admin shell DOM contract（`data-testid="admin-shell"` / `data-theme="cool"` / `data-route-group="admin"` / `data-shell-mode="sidebar"`） | `app/(admin)/layout.spec.tsx` TC-03 |
| children が `main[data-route="admin"]` 配下に 1 つだけ | TC-03 |
| 未認証 → `/login?next=/admin` / non-admin → `/login?gate=forbidden` | TC-01 / TC-02 |
| nav 全 13 item（public 3 + members 1 + admin 9） | `SidebarShell.server.spec.tsx` / `shell-config.spec.ts` |
| schemaDiff badge（queued のみ count / 失敗時 0） | `SidebarShell.server.spec.tsx` TC-05/06 / `schema-diff-count.spec.ts` |
| active state（`usePathname` 一致 item に `aria-current="page"`） | `SidebarShell.spec.tsx` |
| collapse で nav label が `sr-only` | `SidebarShell.spec.tsx` |
| user menu の 3 role action 集合 + admin badge + collapsed sr-only | `SidebarUserMenu.spec.tsx` |
| axe critical 0（layout / shell） | `layout.spec.tsx` TC-08 / `SidebarShell.spec.tsx` |

## 目視確認チェックリスト（screenshot 取得時・user-gated）

実 screenshot 取得は staging deploy + 認証済み admin session が必要で、project 既定で **user-gated**。
以下を撮影・確認する想定:

1. `/admin`（lg）: persistent sidebar 展開（272px）、3 グループ nav、左下 user menu に「管理者」ラベル。
2. `/admin`（md）: sidebar 初期 collapsed（64px・icon のみ・label `sr-only`）。
3. `/admin`（sm < 768px）: aside hidden + mobile bar の hamburger（`SidebarMobileTrigger`）→ tap で drawer overlay。
4. 各 admin route（members / tags / schema / meetings / requests / identity-conflicts / audit / dashboard/attendance）で
   対応 nav item が active ハイライト（TECH-M-02 の client `usePathname()` 解決を目視）。
5. schema に未解決 diff がある状態で schema nav に warn badge。
6. user menu popover: プロフィール / プロフィール編集申請 / 管理者ダッシュボード / ログアウト の 4 action。

## 取得手順（user 承認後）

```bash
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging   # user-gated
# 認証済み admin session で playwright admin-staging-visual project を実行し
# outputs/phase-11/ に PNG を保存（既存 admin-visual baseline フローに準拠）
```

> screenshot 画像は未取得（user-gated）。取得後に本ディレクトリへ PNG を配置し、
> Phase 12 implementation-guide.md から参照する。

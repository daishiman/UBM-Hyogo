`[実装区分: 実装仕様書]`

# outputs/phase-2: アーキテクチャ（issue-1017 / verify_existing）

landed 実装（commit `278001606`）の構成図。

## 階層図

```
┌──────────────────────────────────────────────────────────────┐
│ RouteGroupLayout  (server, async)                            │
│   apps/web/app/(public)/layout.tsx  routeKey="public"        │
│   apps/web/app/(member)/layout.tsx  routeKey="member"        │
│                                                              │
│   await headers().get("x-pathname") ?? "/" | "/profile"      │
│   <div data-theme data-route-group data-shell-mode data-testid>│
│        │                                                     │
│        ▼  activePath / routeKey / sectionRhythm / slot       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ SidebarShellServer  (server)                          │  │
│  │   SidebarShell.server.tsx                             │  │
│  │     getSession() → resolveRole(viewer|member|admin)   │  │
│  │     loadSchemaDiffCount()  (admin only)               │  │
│  │     buildNavForRole(role, { schemaDiffCount })        │  │
│  │        │                                              │  │
│  │        ▼  role / user / navGroups (plain object)      │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │ SidebarShell  (client)                          │ │  │
│  │  │   useSidebarState()  … collapse 状態（client）   │ │  │
│  │  │   ├─ SidebarNav / SidebarNavGroup / SidebarNavItem│ │  │
│  │  │   ├─ SidebarMobileTrigger / SidebarDrawer        │ │  │
│  │  │   ├─ {children}                                  │ │  │
│  │  │   └─ <PublicFooter />  ← public layout のみ       │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## データフロー

```
HTTP request
   └─ headers: x-pathname ──► RouteGroupLayout (activePath)
   └─ session cookie ──────► SidebarShellServer.getSession() ──► role
                                                              ──► buildNavForRole ──► navGroups
RouteGroupLayout ──(activePath, slot, routeKey)──► SidebarShellServer
SidebarShellServer ──(role, user, navGroups : plain object)──► SidebarShell (client)
SidebarShell ──(usePathname)──► active item 最終確定（hydration 後）
```

## 責務分離（1 方向依存）

| 層 | server/client | 状態 / データ | 行わないこと |
| --- | --- | --- | --- |
| RouteGroupLayout | server | activePath / slot 配線 | role 判定・nav 構築 |
| SidebarShellServer | server | session / role / navGroups / schemaDiffCount | collapse state |
| SidebarShell | client | collapse state（useSidebarState） | session 取得 |

## OKLch トークン

- shell の色は `apps/web/src/styles/tokens.css` の `--shell-*` トークン（#1028 で 5 件追加）経由。HEX 直書き / `bg-[#xxx]` なし。

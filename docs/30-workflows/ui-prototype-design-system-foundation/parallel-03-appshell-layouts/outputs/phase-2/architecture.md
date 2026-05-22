# Phase 2 — アーキテクチャ

参照: `../../phase-02-architecture.md`

## AppShell 構造

```
<div data-theme data-route-group data-testid>
  [<aside data-shell="sidebar"> ... </aside>]  ← admin only
  <header data-shell="topbar"> ... </header>
  <main data-route="public|admin|member"> {children} </main>
  [<footer data-shell="footer"> ... </footer>]  ← public only
</div>
```

## 3 系統の差分

| | Public | Admin | Member |
|--|--|--|--|
| theme | warm | cool | warm |
| route-group | public | admin | member |
| chrome | topbar + footer | sidebar + topbar | topbar |
| Server/Client | Server | Server (async) | Server |
| auth gate | なし | `getSession()` + isAdmin | なし |

## 依存

- 既存 primitive: `PublicHeader` / `PublicFooter` / `AdminSidebar` / `MemberHeader`
- 既存 helper: `getSession` / `next/navigation.redirect`
- selector hook の正本: parallel-01/02 で globals.css に追加済み (本 sub-workflow では確立しない)

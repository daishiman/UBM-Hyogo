# Phase 8: リファクタ

## リファクタ方針

- `AdminSidebar` / `PublicHeader*` / `MemberHeader` は C/D の最後に削除する。
- icon / nav config / user action config は pure module に寄せ、layout 側へ分岐を広げない。
- `SidebarShellServer` が session と schemaDiffCount を集約し、呼出側 layout は activePath と children のみを持つ。

## grep gates

```bash
git grep -n "PublicHeader\\|SessionAwarePublicHeader\\|PublicHeaderWithPath\\|MemberHeader\\|components/layout/AdminSidebar" -- apps/web
```

実装完了時は、削除対象名の production import が 0 件であること。

## 完了条件

旧 shell component の責務が新 shell に移り、二重 shell / 二重 nav が残らない。

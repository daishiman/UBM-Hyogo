# Phase 5: 実装手順

## 手順

1. Task A: `SidebarShell` / nav config / state hook / tokens を追加する。
2. Task B: `SidebarUserMenu` と role action config を追加する。
3. Task E: mobile trigger / drawer / a11y close behavior を追加する。
4. Task C: public/member layouts を `SidebarShellServer` に移行し、旧 public/member header を削除する。
5. Task D: admin layout を `SidebarShellServer` に移行し、旧 `AdminSidebar` を削除する。
6. Task F: Playwright smoke/visual project と helper を追加する。

## 境界

API / D1 / Google Form / Auth.js middleware / npm package は変更しない。必要な CSS token は `tokens.css` に OKLch / existing token alias 経由で最小追加する。

## 完了条件

A-F の DoD がすべて満たされ、Phase 9 の local gates が green。

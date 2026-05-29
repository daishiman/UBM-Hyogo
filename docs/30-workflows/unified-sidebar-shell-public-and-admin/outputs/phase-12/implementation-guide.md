---
実装区分: 実装仕様書
状態: spec_created
Phase: 12
作成日: 2026-05-28
task_id: unified-sidebar-shell-public-and-admin
---

# Implementation Guide

## Part 1: 中学生レベルの説明

今は公開ページ、マイページ、管理ページで画面の枠が別々に作られている。これを同じサイドバー部品にまとめる。ログインしていない人には公開メニューだけ、会員にはマイページも、管理者には管理メニューも出す。スマホでは横に出しっぱなしにせず、ボタンで開く引き出しにする。

## Part 2: 技術者向け

`SidebarShellServer` が `getSession()` を呼び、`viewer` / `member` / `admin` の role と nav groups を構築して `SidebarShell` に渡す。client 側は collapsed / drawer state、active item、UserMenu popover のみを持つ。

### 実装順

1. Task A: shell primitive / nav config / tokens
2. Task B: UserMenu / Avatar / action config
3. Task E: mobile trigger / drawer
4. Task C: public/member layout integration and legacy header deletion
5. Task D: admin layout migration and legacy AdminSidebar deletion
6. Task F: Playwright smoke / visual baseline

### 不変条件

- role 判定は `SessionUser.isAdmin` のみ
- API / D1 / Google Form schema / Auth.js middleware は変更しない
- admin nav は現行 `AdminSidebar.tsx` の 9 admin item を維持
- visual baseline は Linux runner を正とし、macOS local PNG は commit しない

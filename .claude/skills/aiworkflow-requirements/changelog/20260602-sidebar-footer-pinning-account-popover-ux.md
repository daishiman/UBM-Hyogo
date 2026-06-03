# 2026-06-02 sidebar-footer-pinning-and-account-popover-ux

## Summary

`sidebar-footer-pinning-and-account-popover-ux` を `implemented_local_evidence_captured / implementation / VISUAL / staging_visual_pending_user_gate` として同期した。

## Changes

- `apps/web/src/components/shell/SidebarShell.tsx`: desktop sidebar を nav scroll area + fixed footer area に分離し、`<main>` を flex column 化。
- `apps/web/src/components/shell/SidebarUserMenu.tsx`: `<details>` 正本を維持し、`browserDocument()` 経由で outside pointerdown / Escape close を追加。
- `apps/web/src/components/shell/SidebarNavItem.tsx`: collapsed center alignment と badge dot を追加。
- `apps/web/src/styles/globals.css`: `[data-shell="sidebar"]` を `height/max-height: 100dvh` + `overflow:hidden` に同期。
- `apps/web/src/styles/legacy-public.css`: `PublicFooter` を `margin-top:auto` へ同期。
- focused component tests / typecheck / design-token / lint evidence を workflow と aiworkflow indexes に同期。

## User-Gated Boundary

staging authenticated screenshots, commit, push, and PR remain user-gated.

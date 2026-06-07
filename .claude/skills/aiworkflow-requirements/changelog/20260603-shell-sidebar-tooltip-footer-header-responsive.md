# 2026-06-03 shell-sidebar-tooltip-footer-header-responsive sync

`docs/30-workflows/shell-sidebar-tooltip-footer-header-responsive/` を `implemented_local_evidence_captured / implementation / VISUAL / local_browser_screenshots_present_staging_visual_pending_user_gate` として同期。

- `apps/web` shell に `SidebarTooltip`、collapsed nav/public-return/collapse-toggle tooltip、user-menu summary 内 tooltip、public footer sticky bottom、mobile-bar sticky top を実装。
- focused shell Vitest 5 files / 33 tests PASS。
- local browser screenshots 3 PNG present（automation-30 review で tooltip clipping を検出し、collapsed `SidebarNav` / `<aside>` を `overflow-visible` へ補正）。
- Phase 12 strict 7 に `outputs/phase-12/main.md` を物理追加。
- aiworkflow quick-reference / resource-map / task-workflow-active / artifact inventory / LOGS を同期。
- artifact inventory に番号付き Lessons **L-SHTL-001..005** を体系化（tooltip/sticky は祖先 `overflow` にクリップ / `<details><summary>` は sibling wrap 不可で内部 bubble / CSS sticky は jsdom 検証不可で staging visual へ委譲 / strict 7 `main.md` は物理必須 / tooltip は accessible name 移管せず `aria-describedby` description 付与）。
- API / D1 / Google Form / auth middleware は変更なし。
- staging visual screenshots、commit、push、PR は user-gated。

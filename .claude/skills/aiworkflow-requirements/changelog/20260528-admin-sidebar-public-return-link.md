# 2026-05-28 admin-sidebar-public-return-link

`docs/30-workflows/completed-tasks/admin-sidebar-public-return-link/` を `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION` として同期した。

## Summary

- `AdminSidebar` の旧 `ホーム` grouped nav を削除し、footer 直前の `data-role="public-return"` anchor へ移動。
- `AdminSidebarNavItem` 拡張案は不採用に統一。
- focused Vitest 11 PASS、grep gate PASS、local Playwright visual fixture screenshot 3 枚を Phase 11 evidence として保存。
- Phase 12 strict 7 と root/output artifacts parity を追加。
- `task-workflow-active.md` / `quick-reference.md` / `resource-map.md` / artifact inventory / LOGS を同一 wave で同期。

## Lessons Learned

- [[lessons-learned-admin-sidebar-public-return-link-2026-05]] — L-ADMRET-001..005（grouped nav → footer 隣接 anchor 移設 / shared primitive 拡張不採用基準 / DOM 1-hop 直前 assertion / `implementation_files` 明示時の state 早期昇格 / local Playwright visual fixture で Phase 11 自走）
- task-specification-creator [[patterns-lessons-and-pitfalls]] 末尾「Admin sidebar 公開復帰 link 配置 + shared primitive 拡張回避パターン (2026-05-28)」節に汎化反映済み

## User-Gated

Staging runtime visual observation, commit, push, and PR.

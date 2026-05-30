# 20260528 unified-sidebar-shell-public-and-admin

`unified-sidebar-shell-public-and-admin` を `spec_created / implementation / VISUAL` として同期。

- workflow root: `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/`
- task-A sub-workflow: standalone `docs/30-workflows/task-A-sidebar-shell-primitive/` を `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/tasks/task-A-sidebar-shell-primitive/` へ統合
- Phase 1-13、root/output `artifacts.json` parity、Phase 12 strict 7、30-method compact evidence を追加
- Admin nav current code を確認し、Admin group 9 item / admin total 13 item を正本化
- quick-reference / resource-map / task-workflow-active / artifact inventory を同一 wave で同期
- Task B sub-workflow `unified-sidebar-shell-task-b-user-menu-and-role-handling` を root/output artifacts parity 付きで登録。strict 7 は parent root 集約、sub 側は `outputs/phase-12/phase12-task-spec-compliance-check.md` のみ所有
- apps/web implementation、local visual capture、CI baseline、commit、push、PR は user-gated

## Lessons Learned (Task A wave)

Task A (`tasks/task-A-sidebar-shell-primitive/`) サブworkflow が `implementation_completed` に到達。`apps/web/src/components/shell/` 11 ファイル + 3 spec + tokens.css 5 トークン (cool theme variant 込み) を実装。詳細は `lessons-learned/lessons-learned-unified-sidebar-shell-task-a-2026-05.md`。

- L-USS-001 parent + nested sub-workflow topology (`tasks/<task-id>/` に collapse)
- L-USS-002 Server / Client 境界を slot 固定 (`SidebarShellServer` のみ session 解決)
- L-USS-003 SSR-safe collapse state (`useEffect` hydrate / 初期値 deterministic)
- L-USS-004 `buildNavForRole` pure 関数化 (viewer=3 / member=4 / admin=13)
- L-USS-005 Task B 先行実装でも上流 Task A 契約は崩さない (slot 契約)
- L-USS-006 tokens.css 5 トークン + `[data-theme='cool']` variant 同時追加

## Lessons (Task B wave)

L-USERMENU-001 / L-USERMENU-002 / L-USERMENU-003 / L-USERMENU-004 / L-USERMENU-005 を `workflow-unified-sidebar-shell-public-and-admin-artifact-inventory.md` の `## Lessons Learned` 節に記録。native `<details>` popover 契約 / role→action pure function / server-client 境界 props 配線 / focused vitest + visual-harness 2 段 evidence / parent+sub strict 7 集約の 5 パターンを Task B 実装由来の苦戦箇所として体系化した。

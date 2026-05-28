# Phase 13: PR

## PR title 候補

- `feat(admin): AdminAppShell topbar 撤去 + Sidebar プロトタイプ準拠化 (Refs #894 #895)`

## PR body 骨子

```
## Summary
- AdminAppShell の topbar から固定「管理」と空 actions slot を撤去し、page-head (AdminPageHeader) に title/breadcrumb/actions 所有権を一本化
- AdminSidebar をプロトタイプ準拠の 3 group / active highlight / schema diff badge / user-chip footer 構成へ刷新
- 新規: AdminSidebarNavItem / AdminBrandBlock / isActive 純関数 + spec 一式

## Changes
- apps/web/app/(admin)/layout.tsx: topbar header 撤去・schema diff fetch 追加
- apps/web/src/components/layout/AdminSidebar.tsx: 書き直し
- apps/web/src/components/layout/AdminSidebarNavItem.tsx: 新規
- apps/web/src/components/layout/AdminBrandBlock.tsx: 新規
- apps/web/src/components/layout/isActive.ts: 新規
- 4 spec 新規 / 1 spec 拡充

## Test Plan
- [ ] mise exec -- pnpm typecheck
- [ ] mise exec -- pnpm lint
- [ ] mise exec -- pnpm --filter web test
- [ ] mise exec -- pnpm verify-design-tokens
- [ ] mise exec -- pnpm build
- [ ] staging visual evidence (outputs/phase-11/)

## Refs
- #894 (AdminTopbar breadcrumb 統合・本 PR で slot 廃止へ再整流)
- #895 (admin topbar actions client island・本 PR で page-head 集約へ再整流)
- 親 workflow: docs/30-workflows/admin-ui-prototype-alignment/
- 本 spec: docs/30-workflows/completed-tasks/admin-shell-topbar-sidebar-integration/
```

- base: `dev` (CLAUDE.md PR 既定)

---

## DoD (Definition of Done)

- [ ] `mise exec -- pnpm build` 成功
- [ ] `mise exec -- pnpm typecheck` pass
- [ ] `mise exec -- pnpm lint` pass
- [ ] 新規/既存 spec all pass (`pnpm --filter web test`)
- [ ] `pnpm verify-design-tokens` green (HEX 直書き 0)
- [ ] staging deploy 後、13 nav items total / 9 admin-group items のうち pathname 一致のみ 1 件 highlight される
- [ ] topbar に静的「管理」が表示されない (layout 設計上 page-head が title/breadcrumb の単一所有者)
- [ ] `<Breadcrumb` 直貼り撤去は Task C の owner として維持し、本 task では page-head 集約方針と依存関係を明記済み
- [ ] `bash scripts/verify-pr-ready.sh` green (gate-metadata:validate / verify:phase12-compliance / indexes:rebuild drift)
- [ ] PR base = `dev`
- [ ] commit / push / PR creation are user-gated; do not execute automatically

## 実装着手前に確認する現行事実

1. `GET /admin/schema/diff` の既存 response shape (`items[].status` で `unresolved` 判定可能か)
2. 既存 inline SVG strategy に合わせるための icon class / aria-hidden 方針
3. `apps/web/src/components/ui/Avatar.tsx` の props と sidebar footer で必要な最小 props
4. `safeServerFetch` の cache / no-store 方針 (schema diff fetch のキャッシュ戦略)
5. プロトタイプ admin route の topbar 完全撤去 (本仕様の前提) が親 workflow Phase 2 design.md と整合するか最終確認

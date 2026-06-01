# Phase 11 — 手動テスト / 視覚証跡記録（Task E mobile drawer responsive）

## タスク種別宣言

- taskType: `implementation`
- visualEvidence: `VISUAL`
- 証跡の主ソース: focused vitest（present）+ 375 / 768 / 1280 px の screenshot（`outputs/phase-11/screenshots/`、present）
- 現状: **implemented_local_runtime_pending**。コード実装、focused Vitest、local screenshot は完了。staging visual は未取得（`pending`）。

## focused Vitest

| コマンド | 結果 | Evidence |
|---------|------|----------|
| `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/components/shell/__tests__/SidebarMobileTrigger.spec.tsx apps/web/src/components/shell/__tests__/SidebarDrawer.spec.tsx apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx` | PASS（4 files / 21 tests） | `outputs/phase-11/evidence/focused-vitest.log` |

## 取得済み screenshot（canonical 名）

| ファイル名 | viewport | 状態 | 期待 |
|-----------|----------|------|------|
| `shell-drawer-mobile-closed.png` | 375px | present | hamburger 表示・sidebar hidden・drawer 非表示 |
| `shell-drawer-mobile-open.png` | 375px | present | drawer overlay（role=dialog）+ backdrop |
| `shell-sidebar-tablet-collapsed.png` | 768px | present | sidebar visible・初期 collapsed・hamburger hidden |
| `shell-sidebar-desktop-expanded.png` | 1280px | present | sidebar visible・expanded（localStorage 優先） |

## 手動確認チェックリスト（local visual-harness で確認済み）

- [x] 375px: hamburger クリックで drawer が開く（AC-1）
- [x] drawer に `role="dialog"` `aria-modal="true"` `id="shell-drawer"`（AC-3）
- [x] Esc / backdrop クリックで閉じる（AC-4、focused Vitest）
- [x] drawer 内リンククリック → 遷移 + route-close（AC-5、focused Vitest）
- [x] drawer open 時 `<body data-shell-drawer-open="true">`・背景 scroll 停止（AC-6）
- [x] open 時 initial focus が drawer 内最初のリンクへ（AC-7、focused Vitest）
- [x] 768px: 初期 collapsed・hamburger hidden（AC-8）
- [x] 1280px: expanded、localStorage の collapsed=true があれば collapsed 優先（AC-8）

## 既知制限

- local screenshot は取得済み。staging runtime visual は user-gated。

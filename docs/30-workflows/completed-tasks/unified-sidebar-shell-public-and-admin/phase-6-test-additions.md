# Phase 6: テスト追加

## 追加テスト

| File | Purpose |
| --- | --- |
| `apps/web/src/components/shell/__tests__/shell-config.spec.ts` | role projection の pure contract |
| `apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx` | collapsed / drawer state |
| `apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx` | shell DOM |
| `apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx` | UserMenu actions |
| `apps/web/src/components/shell/__tests__/SidebarDrawer.spec.tsx` | drawer a11y |
| `apps/web/app/(public)/__tests__/layout.spec.tsx` | public layout integration |
| `apps/web/app/(member)/__tests__/layout.spec.tsx` | member layout integration |
| `apps/web/app/(admin)/__tests__/layout.spec.tsx` | admin gate + shell integration |
| `apps/web/tests/e2e/sidebar-shell-smoke.spec.ts` | role x viewport smoke |

## 完了条件

新規テストが実装対象と 1:1 対応し、旧 component 削除後の import 0 件 grep が含まれる。

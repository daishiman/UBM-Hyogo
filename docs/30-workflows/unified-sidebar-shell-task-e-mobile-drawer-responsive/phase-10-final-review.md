---
spec_classification: implementation_spec
state: spec_created
phase: 10
phase_name: 最終レビュー
created_at: 2026-05-29
workflow: docs/30-workflows/unified-sidebar-shell-task-e-mobile-drawer-responsive/
---

# Phase 10: 最終レビュー

## 10.1 AC 突合

Phase 9.3 の結果と Phase 1.3 の AC 一覧を 1 対 1 突合。実測列は実装時に埋める。

| AC | 期待 | 実測 (Phase 9 結果) | 判定 |
|----|------|---------------------|------|
| AC-E1 | `<aside>` に `hidden md:flex` / hamburger に `md:hidden` | — | (実装時に埋める) |
| AC-E2 | hamburger click → `setDrawerOpen(true)` | — | — |
| AC-E3 | drawer が `role="dialog"` + `aria-modal="true"` | — | — |
| AC-E4 | Esc / backdrop → `onClose` | — | — |
| AC-E5 | `body[data-shell-drawer-open="true"]` → scroll lock | — | — |
| AC-E6 | open 時 初期 focus + focus trap | — | — |
| AC-E7 | route 変化で auto-close | — | — |
| AC-E8 | drawer 内 link click → close + 遷移 | — | — |
| AC-E9 | `<1024px` 初期 collapsed / `>=1024px` expanded（localStorage 優先） | — | — |
| AC-E10 | matchMedia 1 回限り（SSR 未参照） | — | — |
| AC-E11 | drawer は `md:hidden` で md+ は unmount | — | — |

## 10.2 不変条件再 grep

```bash
# I-E2: state owner は useSidebarState 1 系。trigger/drawer に useState が無い
grep -nE 'useState' apps/web/src/components/shell/SidebarMobileTrigger.tsx \
  apps/web/src/components/shell/SidebarDrawer.tsx
# 期待: 出力なし（state は useSidebarShellContext / useSidebarState 経由のみ）

# I-E4: shell 配下に HEX / palette 直値が無い
grep -rnE '(bg|text|border)-\[#' apps/web/src/components/shell
# 期待: 出力なし

# I-E5: matchMedia の出現は useSidebarState 内 1 箇所のみ
grep -rnE 'matchMedia' apps/web/src/components/shell
# 期待: useSidebarState.ts に 1 件のみ
# resize listener が無いこと
grep -rnE "addEventListener\(\s*['\"]resize" apps/web/src/components/shell
# 期待: 出力なし

# I-E6: focus trap が useFocusTrap 単一 source。SidebarDrawer に trap 本体が無い
grep -rnE 'useFocusTrap' apps/web/src/components/ui/Drawer.tsx \
  apps/web/src/components/shell/SidebarDrawer.tsx
# 期待: 双方が apps/web/src/lib/a11y/useFocusTrap を import している
grep -rnE "addEventListener\(\s*['\"]keydown|previousFocus" apps/web/src/components/shell/SidebarDrawer.tsx
# 期待: 出力なし（trap 本体は hook に集約・SidebarDrawer 側に再実装が無い）
```

## 10.3 観察事実との照合

- Task A の sidebar collapse / expand 挙動（`toggleCollapsed` / localStorage `ubm:shell:collapsed`）が回帰していないこと（I-E1）
- md viewport 相当で drawer が DOM に mount されないこと（AC-E11 / I-E5）
- localStorage に `ubm:shell:collapsed` を持つ既存ユーザの `mode` が、本タスク導入後も変わらないこと（matchMedia より localStorage が優先される。AC-E9）
- backdrop / drawer 幅が token 経由で表示され、既存 shell の見た目に直値起因の差分が出ていないこと（I-E4）
- `Drawer.tsx` を `useFocusTrap` へ内部 refactor した後も、既存 consumer（`MemberDrawer` / `BulkRepublishDrawer`）と `primitives.component.spec.tsx` が無改修で green であること（公開 API 不変・R-E7）

## 10.4 進行判定

すべて pass → Phase 11 へ。
fail → Phase 5 / 6 / 8 へ戻る。

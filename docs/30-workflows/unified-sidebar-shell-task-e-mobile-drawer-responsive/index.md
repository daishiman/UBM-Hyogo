---
task_id: unified-sidebar-shell-task-e-mobile-drawer-responsive
spec_classification: implementation_spec
state: spec_created
created_at: 2026-05-29
task_type: implementation
visual_category: VISUAL
implementation_mode: new
parent_workflow: docs/30-workflows/unified-sidebar-shell-public-and-admin/
source_task: docs/30-workflows/unified-sidebar-shell-public-and-admin/tasks/task-E-mobile-drawer-responsive.md
branch: feat/task-spec-unified-sidebar-shell-task-e-mobile-drawer
---

# unified-sidebar-shell Task E — Mobile / Tablet drawer + responsive 挙動

親 workflow `unified-sidebar-shell-public-and-admin` の Task E を Phase 1-13 の単一責務実装仕様書群へ分解した実装仕様書ディレクトリ。後続の実装プロンプト（`03.実装.md`）が、このディレクトリだけを読めば確実にコードへ反映できる粒度で記述する。

## 実装区分

`[実装区分: 実装仕様書]` — 親 task ファイル冒頭で `[実装区分: 実装仕様書]` が明示されており、新規 Client component 2 件・既存 hook / shell の編集・focus trap / scroll lock / route 連動 close を伴う UI 実装タスクであるため（CONST_004）。

## ゴール（要旨）

`< md`（768px 未満）で sidebar を hidden 化し、左上 hamburger trigger から overlay drawer として表示する。タブレット（`md ~ lg`、768〜1023px）では sidebar を**初期 collapsed** とする。breakpoint 判定は CSS（Tailwind `md:`）を正本とし、JS の `matchMedia` 依存は「初期 collapsed 判定」の 1 回だけに閉じる。

## スコープ（Task E core 6 + 共有 a11y 基盤 3）

### 新規（5）

- `apps/web/src/components/shell/SidebarMobileTrigger.tsx` (Client)
- `apps/web/src/components/shell/SidebarDrawer.tsx` (Client)
- `apps/web/src/components/shell/__tests__/SidebarMobileTrigger.spec.tsx`
- `apps/web/src/components/shell/__tests__/SidebarDrawer.spec.tsx`
- `apps/web/src/lib/a11y/useFocusTrap.ts`（dialog focus trap の単一 source。`Drawer.tsx` から抽出し共有）+ `__tests__/useFocusTrap.spec.tsx`

### 編集（3）

- `apps/web/src/components/shell/SidebarShell.tsx`（drawer mount + `< md` で `<aside>` hidden）
- `apps/web/src/components/shell/useSidebarState.ts`（route 変化で drawer 自動 close + 初期 collapsed 判定）
- `apps/web/src/components/ui/Drawer.tsx`（**内部 refactor のみ**: focus trap を `useFocusTrap` 呼び出しへ置換。公開 props `{ open, onClose, title, children }` は不変＝既存 consumer `MemberDrawer` / `BulkRepublishDrawer` 無改修）

## 前提（prerequisite）

本 spec は親 workflow の **Task A（`SidebarShell` primitive）が同一実装サイクル内で先行実装済み**であることを前提とする。Task A が提供する以下の契約に依存する:

- `useSidebarState()` → `{ mode, drawerOpen, toggleCollapsed, setDrawerOpen }`（Task E が `drawerOpen` / `setDrawerOpen` / 初期 collapsed を拡張）
- `SidebarShellContext.tsx`（drawer/collapse 操作を子孫へ配る Client context）
- `SidebarShell.tsx`（`mobileTriggerSlot: ReactNode` を受け入れる hosting point）
- localStorage key `ubm:shell:collapsed`、shell 用 OKLch トークン（`--shell-bar-w` 等）

> これは「先送り」ではなく親 workflow 内の sibling 依存である（CONST_007 の例外ではない）。Task E 自体は Task A の契約が存在すれば 1 サイクルで完了する単一責務スコープ。実装プロンプト着手時に Task A 成果物（`apps/web/src/components/shell/` 配下）が存在することを Phase 1 の P50 で確認する。

## Phase 一覧

| Phase | 名称 | ファイル |
|-------|------|---------|
| 1 | 要件定義 | [phase-1-requirements.md](phase-1-requirements.md) |
| 2 | 設計 | [phase-2-design.md](phase-2-design.md) |
| 3 | 設計レビュー | [phase-3-design-review.md](phase-3-design-review.md) |
| 4 | テスト計画 | [phase-4-test-plan.md](phase-4-test-plan.md) |
| 5 | 実装手順 | [phase-5-implementation.md](phase-5-implementation.md) |
| 6 | テスト追加 | [phase-6-test-additions.md](phase-6-test-additions.md) |
| 7 | カバレッジ | [phase-7-coverage.md](phase-7-coverage.md) |
| 8 | リファクタ | [phase-8-refactor.md](phase-8-refactor.md) |
| 9 | QA / CI gate | [phase-9-qa.md](phase-9-qa.md) |
| 10 | 最終レビュー | [phase-10-final-review.md](phase-10-final-review.md) |
| 11 | 手動テスト / Evidence | [phase-11-manual-test.md](phase-11-manual-test.md) |
| 12 | ドキュメント同期 | [phase-12-documentation.md](phase-12-documentation.md) |
| 13 | PR | [phase-13-pr.md](phase-13-pr.md) |

## 関連 task

- 親: `docs/30-workflows/unified-sidebar-shell-public-and-admin/`
- sibling: Task A（SidebarShell primitive）/ Task B（UserMenu）/ Task C（public/member layout）/ Task D（admin layout 移行）/ Task F（visual baseline smoke）

## 不変条件（要旨）

- I-E1: Task A の `useSidebarState` / `SidebarShellContext` / `SidebarShell` 契約は破壊しない。追加のみ（後方互換）。
- I-E2: drawer / collapse の state owner は `useSidebarState` 1 系のみ。新規 state store を増やさない。
- I-E3: API endpoint / D1 / Google Form schema / auth middleware は不変（親不変条件 #5）。
- I-E4: 色・寸法は tokens 経由（Task A 追加の `--shell-*` トークン）。HEX 直書き / `bg-[#xxx]` 禁止。
- I-E5: breakpoint 判定は CSS（Tailwind `md:`）正本。JS `matchMedia` 依存は初期 collapsed 判定の 1 回だけ。
- I-E6: focus trap（初期 focus / Tab ループ / Esc / previousFocus 復帰）は `apps/web/src/lib/a11y/useFocusTrap.ts` を**単一 source** とし、`Drawer.tsx` と `SidebarDrawer.tsx` が同一 hook を共有する。SidebarDrawer に独自 trap を再実装しない。scroll lock / backdrop / md:hidden / token 幅は SidebarDrawer 固有の chrome として hook の外側に置く。

# system-spec-update-summary — sidebar-footer-pinning-and-account-popover-ux

> implemented_local_evidence_captured。VISUAL / implementation。local code + component evidence は取得済み。commit / PR / staging screenshot は user-gated。

## Step 1-A: 完了タスク記録（implemented_local_evidence_captured を記録）

- task_id: `sidebar-footer-pinning-and-account-popover-ux`
- 内容: 統一 sidebar shell の UI/UX 不具合 4 件を 1 実装サイクルで解消する Phase 1-13 実装仕様書を作成。
  - C1: sidebar footer 固定（`globals.css` height:100dvh + `SidebarShell` aside 2 段 flex）
  - C2: collapse はみ出し（overflow-hidden + justify-center + badge ドット）
  - C3: account popover 外側クリック + Escape 閉じ（`SidebarUserMenu` に `browserDocument()` 経由 pointerdown/keydown listener、open 中のみ・`<details>.open` 正本）
  - C4: main footer sticky（`SidebarShell` `<main>` flex-col + `legacy-public.css` public-footer margin-top:auto）
- 区分: 実装仕様書（CONST_004）。CSS レイアウト + React component の挙動修正を伴うコード変更タスク。
- **状態: implemented_local_evidence_captured**（本サイクルで Phase 1-13 仕様書 + Phase 12 必須 6 成果物 + Phase 13 ドラフト + local implementation + local verification を完了。**commit / push / PR / staging screenshot は user 承認後に実施**）。

## Step 1-B: 実装状況

- 現状: **implemented_local_evidence_captured**（apps/web のコード差分と focused tests を本サイクルで反映）。
- 新規ソース: **0**（既存 shell コンポーネント + 既存 CSS 正本の編集に閉じる）。
- 編集済み: ソース 5（`globals.css` / `SidebarShell.tsx` / `SidebarUserMenu.tsx` / `SidebarNavItem.tsx` / `legacy-public.css`）+ テスト 3（`SidebarShell.spec.tsx` / `SidebarUserMenu.spec.tsx` / `SidebarNavItem.spec.tsx`）。
- 実走ゲート: focused component vitest 3 files / 22 tests PASS、`pnpm --filter @ubm-hyogo/web typecheck` PASS、`pnpm --filter @ubm-hyogo/web verify-design-tokens` PASS、`pnpm --filter @ubm-hyogo/web lint` PASS。

## Step 1-C: 関連タスク

- 親: `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/`（統一 shell primitive）。
- sibling: `issue-1024-sidebar-collapse-cookie-persistence`（collapse cookie 永続化）/ `issue-1016-sidebar-mobile-drawer-responsive`（mobile drawer）/ `admin-sidebar-public-return-link`（#1021 公開サイトに戻る導線）。
- 関連: `task-c-public-member-sidebar-shell-integration`（PublicFooter を shell 配下へ保持した layout 統合）。
- 起点: ユーザー報告（2026-06-02 staging スクリーンショット）。GitHub Issue は未起票（issue: null）。
- 重複なし: 既存 sibling はいずれも本 4 concern（footer 固定 / collapse はみ出し / popover 外側クリック / main footer sticky）を実装していない。本タスクは既存 shell 上の additive / 後方互換修正。

## Step 2: 新規インターフェース

| 公開要素 | shape | 公開範囲 |
|----------|-------|----------|
| `data-shell-block="sidebar-footer"` | DOM 観測契約属性（additive）| workflow-local（`apps/web/src/components/shell` 内）|
| `data-shell-block="nav-badge-dot"` | DOM 観測契約属性（additive）| workflow-local |
| `SidebarUserMenu` の `details.open` 派生 state | listener 登録要否のミラー（`<details>.open` が正本）| `SidebarUserMenu` 内ローカル（公開 API 変更なし）|

- **新規型 / 公開 API 追加: なし**。`useSidebarState()` 戻り値 shape・`SidebarShell` public props・`SidebarUserMenu` props は不変（I-1 / I-2）。追加は DOM 契約属性（additive）と component 内ローカル state のみ。
- **aiworkflow-requirements 公開契約更新: N/A**。本タスクは UI 挙動修正であり、AIWorkflowOrchestrator の API / IPC / 状態管理契約（正本仕様）に該当する新規型追加がない。`references/` 正本の更新箇所は存在しない。
- 該当する正本セクション: なし（D1 schema / API endpoint / Google Form / auth 契約はいずれも不変・AC-5）。
- **aiworkflow-requirements 運用台帳更新**: quick-reference / resource-map / task-workflow-active / artifact inventory / changelog へ同一 wave で同期する。新規 API / D1 / Form schema はないため公開契約更新は N/A。

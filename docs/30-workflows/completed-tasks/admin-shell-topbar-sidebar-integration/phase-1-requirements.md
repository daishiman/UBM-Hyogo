# Phase 1: 要件定義

[実装区分: 実装仕様書]

## Required metadata

| Key | Value |
| --- | --- |
| Phase | 1 |
| 機能名 | `admin-shell-topbar-sidebar-integration` |
| 作成日 | 2026-05-26 |
| taskType | `implementation` |
| visualEvidence | `VISUAL_ON_EXECUTION` |
| workflow_state | `implemented_local_evidence_captured` |
| implementation_mode | `existing-admin-shell-alignment` |
| scope | existing admin shell alignment: `(admin)/layout.tsx` + `AdminSidebar` + shell/sidebar specs |

- 親 workflow: `docs/30-workflows/admin-ui-prototype-alignment/`
- Branch: `feat/admin-ui-prototype-alignment`
- 依存: なし (先行可能。Task B/C/D/E すべての前提)
- 関連既存 issue: #894 (AdminTopbar breadcrumb 統合・CLOSED 維持) / #895 (admin topbar actions client island・CLOSED 維持)

## Current inventory gate

| 種別 | 現行 owner | 判定 |
| --- | --- | --- |
| admin shell route group | `apps/web/app/(admin)/layout.tsx` | 既存編集対象 |
| topbar primitive | `apps/web/src/components/layout/AdminTopbar.tsx` | 本 task で layout から撤去予定 |
| topbar actions island | `apps/web/src/features/admin/components/_layout/AdminTopbarActions.tsx` | #895 由来。page-head 集約方針により layout 注入を撤去予定 |
| sidebar primitive | `apps/web/src/components/layout/AdminSidebar.tsx` | 既存編集対象 |
| sidebar tests | `apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx` | 既存 spec 拡充または新 spec 追加対象 |

## ゴール

- プロトタイプ `pages-admin.jsx` / `primitives.jsx` / `styles.css` に準拠した **sidebar mode AppShell** を `apps/web/app/(admin)/layout.tsx` に確立する
- topbar から「静的文字列『管理』」「`aria-hidden` 空 actions slot」の両方を撤去し、page 側 `AdminPageHeader` に title/breadcrumb/actions 所有権を委譲する設計を明文化
- `AdminSidebar` を、3 group (Public / Members / Admin) + active highlight + schema diff badge + user-chip footer のプロトタイプ完全準拠版へ差し替える

## AC (受入条件)

| # | 受入条件 | 検証手段 |
|---|----------|----------|
| AC-1 | `apps/web/app/(admin)/layout.tsx` の topbar から固定文字列「管理」と空 `aria-hidden` 配置が消える | `grep -F '管理' apps/web/app/(admin)/layout.tsx` が 0 件 / vitest layout.spec.tsx で breadcrumb-slot に固定テキストが含まれないこと |
| AC-2 | `AdminSidebar` の nav 項目が、現在の pathname に対応する 1 件のみ `data-active="true"` を持つ (完全一致 + セグメント先頭一致ロジック) | vitest spec で `usePathname='/admin/members/123'` 時に `/admin/members` のみ active となること |
| AC-3 | `AdminSidebar` が 3 group (Public / Members / Admin) に分かれ、各 group ラベルが `.nav-label` 相当の DOM (`data-component="admin-nav-label"`) で出力される | vitest spec で 3 group ラベル文字列が存在すること |
| AC-4 | `/admin/schema` 項目に未解決 schema diff 件数 (`status="queued"`) > 0 のとき warn badge が表示され、件数 0 のとき非表示 | vitest spec で fetch result mock 1 件 / 0 件で DOM 比較 |
| AC-5 | sidebar footer に `user-chip` (Avatar + name + email) と `SignOutButton` の 2 ブロックが描画される | vitest spec で session mock を入れて DOM 検査 |
| AC-6 | 本 task では `<Breadcrumb` 直貼り撤去を実施しない。Task C が撤去 owner であることを Phase 8/12/13 に明記する | `phase-8-refactor.md` と `phase-13-pr.md` に Task C 依存として記録 |
| AC-7 | `verify-design-tokens` CI gate が green。HEX 直書き / `bg-[#xxx]` 0 件 | `pnpm verify-design-tokens` |
| AC-8 | typecheck / lint / build / vitest (web 配下 layout + sidebar 関連 spec) すべて green | `mise exec -- pnpm typecheck && pnpm lint && pnpm --filter web test` |

## スコープ内

- `apps/web/app/(admin)/layout.tsx` topbar slot 契約最終化 (slot は client island としてエクスポートのみ・本体配線は本 task 内)
- `apps/web/src/components/layout/AdminSidebar.tsx` 完全書き直し (active / group / badge / footer)
- 新規: `AdminBrandBlock` (sidebar 上部 brand mark + title) / `AdminSidebarNavItem` (active 判定を担う client component)
- schema diff 件数取得 (layout server boundary で `safeServerFetch('/admin/schema/diff')` 1 回 → props 注入)
- 本 task で追加 / 拡充する vitest spec

## スコープ外

- 各 page の `AdminPageHeader` 採用と Breadcrumb 直貼り撤去本体作業 (Task C)
- `/admin` ダッシュボード 404 / byZone 復旧 (Task B)
- 出席分析 primitive 化 (Task D)
- visual baseline 採取 (Task E)
- 新規 API endpoint・D1 schema 変更 (不変条件で禁止)

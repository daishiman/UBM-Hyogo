---
spec_classification: implementation_spec
state: spec_created
phase: 1
phase_name: 要件定義
created_at: 2026-05-26
task_type: ui_alignment
visual_category: VISUAL
implementation_mode: new
workflow: docs/30-workflows/admin-ui-task-c-pageheader-token-conformance/
source_task: docs/30-workflows/admin-ui-prototype-alignment/tasks/task-C-pages-pageheader-and-token-conformance.md
---

# Phase 1: 要件定義

[実装区分: 実装仕様書] — 親 task ファイルが既に「実装区分: 実装仕様書」と明示しており、変更対象ファイル・props 拡張・token 追加を伴う UI 整流タスクであるため。

## 1.1 ゴール

admin segment 内 11 page のうち、`AdminPageHeader` 未採用の 9 page を統一し、プロトタイプ正本 (`docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx`) の `page-head` + `eyebrow` + `h-page` レイアウトに揃える。同時に `identity-conflicts/page.tsx` に残る Tailwind palette 直書き（`text-zinc-*` / `text-blue-*` / `border-zinc-*` / `divide-zinc-*`）と独自 `<main>` を解消し、layout/main の二重宣言を撤廃する。

## 1.2 スコープ (11 file)

| # | path | 修正内容 |
|---|------|---------|
| 1 | `apps/web/app/(admin)/admin/tags/page.tsx` | Breadcrumb 直貼り → AdminPageHeader |
| 2 | `apps/web/app/(admin)/admin/meetings/page.tsx` | 同上 |
| 3 | `apps/web/app/(admin)/admin/meetings/[id]/page.tsx` | Breadcrumb 不在 → AdminPageHeader 新規付与 |
| 4 | `apps/web/app/(admin)/admin/schema/page.tsx` | Breadcrumb 直貼り + 独自 h1 → AdminPageHeader (actions = "resolve 履歴を見る") |
| 5 | `apps/web/app/(admin)/admin/schema/history/page.tsx` | Header 不在 → AdminPageHeader 新規付与 |
| 6 | `apps/web/app/(admin)/admin/requests/page.tsx` | Breadcrumb 直貼り → AdminPageHeader |
| 7 | `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | Breadcrumb + 独自 `<main>` + palette → AdminPageHeader + token 化 |
| 8 | `apps/web/app/(admin)/admin/audit/page.tsx` | Breadcrumb 直貼り → AdminPageHeader |
| 9 | `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` | 独自 h1 のみ → AdminPageHeader (ヘッダのみ。本体は Task D) |
| 10 | `apps/web/src/features/admin/components/_layout/AdminPageHeader.tsx` | props 拡張 (`eyebrow?: string`) |
| 11 | `apps/web/src/styles/tokens.css` | `--ubm-color-link-default` / `--ubm-eyebrow-tracking` 最小追加 |

## 1.3 受け入れ条件 (AC)

| ID | 内容 | 検証方法 |
|----|------|---------|
| AC-C1 | admin 9 page.tsx 全てで `AdminPageHeader` を import + 使用 | `grep -L 'AdminPageHeader' apps/web/app/\(admin\)/admin/**/page.tsx` の出力に対象 9 file が含まれない |
| AC-C2 | admin segment page.tsx で `Breadcrumb` の直 import / 直 JSX が 0 件 | `grep -rE '<Breadcrumb\b\|from .*components/admin/Breadcrumb' apps/web/app/\(admin\)/admin/**/page.tsx` 空 |
| AC-C3 | admin segment page.tsx で Tailwind palette 直書きが 0 件 | `grep -rE '\b(text\|bg\|border\|divide)-(zinc\|slate\|gray\|neutral\|blue\|red\|green\|amber\|yellow\|sky\|indigo)-[0-9]' apps/web/app/\(admin\)/admin` 空 |
| AC-C4 | admin segment で `bg-\[#` / `text-\[#` インライン HEX が 0 件 | `grep -rE '(bg\|text\|border)-\[#' apps/web/app/\(admin\)/admin` 空 |
| AC-C5 | `identity-conflicts/page.tsx` から独自 `<main>` 消失 | grep で `<main` が 0 件 |
| AC-C6 | `verify-design-tokens` CI gate green | Phase 9 で確認 |
| AC-C7 | 9 page で AdminPageHeader の `title` / `breadcrumbs` / `eyebrow` が Phase 2.1 設計表と一致 | Phase 6 RTL spec |
| AC-C8 | 新規 page-header 系 component を増やしていない | `find apps/web/src -name '*PageHeader*'` の差分が `AdminPageHeader.tsx` のみ |

## 1.4 不変条件

- **I-C1**: AdminPageHeader は 1 系のみ。`PageTitle` 等の別 component を新設しない。
- **I-C2**: 既存 panel (`TagQueuePanel` / `MeetingPanel` / `MeetingAttendancePanel` / `SchemaDiffPanel` / `SchemaDiffHistoryPanel` / `AuditLogPanel` / `RequestQueuePanel` / `IdentityConflictRow`) の内部実装は触らない。page.tsx からの呼び出しシグネチャは維持。
- **I-C3**: API endpoint / D1 / Google Form schema には触らない（親不変条件 #5）。
- **I-C4**: 色は `var(--ubm-color-*)` トークン経由のみ。HEX 直書き禁止。
- **I-C5**: panel 内 KPI / table / status 表現の整流化は Task D / Task E の責務。

## 1.5 スコープ外

- topbar slot 実体化・sidebar group 化 → Task A
- dashboard `/admin/dashboard` の 404 / byZone 修正 → Task B
- `/admin/dashboard/attendance` 本体 (KpiGrid + AdminTable 化) → Task D
- visual baseline snapshot 更新 → Task E

## 1.6 P50 チェック

| # | 項目 | 結果 |
|---|------|------|
| P50-1 | 対象 11 file がすべて存在 | YES（親 task 観察根拠より） |
| P50-2 | AdminPageHeader が `_layout` に存在 | YES |
| P50-3 | `verify-design-tokens` CI gate 稼働中 | YES（task-18 で導入済） |
| P50-4 | OKLch token (`--ubm-color-*`) が `tokens.css` に存在 | YES |
| P50-5 | 親 workflow `admin-ui-prototype-alignment` のスコープ内 | YES |

→ 全 PASS。Phase 2 着手可能。

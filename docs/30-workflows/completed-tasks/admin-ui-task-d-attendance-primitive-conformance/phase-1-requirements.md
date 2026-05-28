---
実装区分: 実装仕様書
Phase: 1
状態: completed
task_id: admin-ui-task-d-attendance-primitive-conformance
親: [index.md](./index.md)
次: [phase-2-design.md](./phase-2-design.md)
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
workflow_state: implemented_local_evidence_captured
---

# Phase 1: 要件定義

## 1.1 背景

`/admin/dashboard/attendance` は ut-02a-followup-002 で追加された画面で、`safeServerFetch` で 3 endpoint を並列取得し KPI + 2 テーブルを描画する。features/admin primitive 群（`KpiCard` / `AdminTable` / `AdminPageHeader`）が他 dashboard で標準採用される一方、本画面は以下の理由で「孤立島」になっている。

- inline で `function KpiCard(...)` を再定義（L131-144）、`_dashboard/KpiCard.tsx` の tone / hint / tabular-nums / token style を享受していない
- by-session / ranking が裸 `<table>`（L76-95, L108-125）で、sticky header / sort / empty state / token style を持つ `AdminTable` を使っていない
- `<h1>` 直書きで、Task C で全 admin page に統合される `AdminPageHeader`（breadcrumbs / actions slot 付き）を採用していない

プロトタイプ（`docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx`）には attendance 専用画面は無いが、`AdminDashboardPage` の構造（`.page-head` → `.grid-4 .card.stat` → `.grid-2` → `.tbl`）が **dashboard 系の正本構造** として確立しており、attendance もこの規約に従う。

## 1.2 ゴール

`/admin/dashboard/attendance` を `AdminPageHeader` + `KpiCard` + `AdminTable` の **3 primitive 構成** に書き換え、features/admin primitive 採用率を本画面で 100% にする。

## 1.3 受け入れ基準（AC）

| ID | 内容 | 検証手段 |
|----|------|---------|
| AC-D1 | `attendance/page.tsx` 内に `<table` 文字列が 0 件 | `grep -c '<table' apps/web/app/\(admin\)/admin/dashboard/attendance/page.tsx` が 0 |
| AC-D2 | `attendance/page.tsx` 内に inline `function KpiCard` 定義が 0 件 | 同 grep `'function KpiCard'` が 0 |
| AC-D3 | `AdminPageHeader` が 1 回以上 import / 採用される | grep `'AdminPageHeader'` ≥ 1 |
| AC-D4 | `KpiCard`（`_dashboard/KpiCard`）が 1 回以上採用される | grep `'from .*_dashboard/Kpi'` ≥ 1 |
| AC-D5 | `AdminTable` が 1 回以上採用される | grep `'AdminTable'` ≥ 1 |
| AC-D6 | 既存 3 endpoint をそのまま利用（新規追加なし） | `apps/api/src/routes/admin/dashboard.ts` diff = 0 行 |
| AC-D7 | `AdminSectionErrorClient` による 3 区画 fail-soft が維持 | 既存 vitest spec green |
| AC-D8 | a11y: page root の accessible name / `role="group"` / AdminTable `caption` が失われない | vitest a11y spec |
| AC-D9 | 3 region で testid が安定（`attendance-overview` / `attendance-by-session` / `attendance-ranking`） | vitest snapshot spec |

## 1.4 スコープ外（明示）

- AdminPageHeader 本体の実装（Task C 側で完了済前提）
- AdminPageHeader の props 拡張（現行 `title` / `description` / `breadcrumbs` / `actions` のみを使う）
- layout / sidebar / breadcrumb 変更（Task A）
- dashboard 本体 / byZone（Task B）
- staging visual baseline 撮影（Task E）
- API endpoint の新規追加 / response shape 変更
- attendance period filter の UI / API 実装（refresh self-link のみ）

## 1.5 不変条件

- 既存 API endpoint surface 維持（不変条件 #5 D1 直接アクセス禁止）
- `safeServerFetch` 経由を継続
- OKLch tokens のみ（HEX 直書き / `bg-[#xxx]` 禁止）
- 新規 primitive は作らない。rate の視覚表現は `AdminTableColumn.render` に閉じる
- `AdminTable` は client component のため、`columns` / `render` / `accessor` 関数は Server Component から直接渡さない。`AttendanceDashboardSections.client.tsx` 内で列定義を所有する

## 1.6 current owner / path topology gate

| owner | 実在 path | 本タスクでの扱い |
|-------|-----------|------------------|
| attendance page | `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` | Server Component fetch owner として維持 |
| attendance client island | `apps/web/app/(admin)/admin/dashboard/attendance/AttendanceDashboardSections.client.tsx` | 新規作成。AdminTable column 関数をここに閉じる |
| AdminPageHeader | `apps/web/src/features/admin/components/_layout/AdminPageHeader.tsx` / barrel `apps/web/src/features/admin/components/index.ts` | `pretitle` は使わず、現行 props のみ利用 |
| KpiCard | `apps/web/src/features/admin/components/_dashboard/KpiCard.tsx` | `value: number` / `hint` / `tone` を利用 |
| KpiGrid | `apps/web/src/features/admin/components/_dashboard/KpiGrid.tsx` | `AdminDashboardView["totals"]` 固定のため本タスクでは使わない |
| AdminTable | `apps/web/src/features/admin/components/_shared/AdminTable.tsx` | client island 内で利用 |
| AdminEmptyState | `apps/web/src/features/admin/components/_shared/AdminEmptyState.tsx` | `testId` prop は無い。固定 `data-testid="admin-empty-state"` と表示文言で検証 |

## メタ情報

| 項目 | 内容 |
|------|------|
| Phase | 1 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |

## 目的

Task D の要件、AC、current owner、実装境界を固定する。

## 実行タスク

- current owner / path topology gate を確認する。
- AC-D1..D9 と scope outside を確定する。

## 参照資料

| 参照資料 | パス | 内容 |
|----------|------|------|
| task-specification-creator | `.claude/skills/task-specification-creator/SKILL.md` | Phase 1-13 / metadata / strict evidence |
| aiworkflow-requirements | `.claude/skills/aiworkflow-requirements/SKILL.md` | system spec / workflow sync |

## 成果物

| 成果物 | パス | 内容 |
|--------|------|------|
| Phase 1 spec | `phase-1-requirements.md` | 要件定義 |

## 完了条件

- [ ] taskType / visualEvidence / workflow_state が明示されている。
- [ ] current owner と実在 path が確認されている。

# Implementation Guide

## Part 1: 中学生レベル

画面を同じ部品でそろえる作業です。学校の掲示板で、クラスごとに紙の大きさや見出しがばらばらだと探しにくくなります。同じ見出し、同じ表、同じ数字カードを使うと、見る人も直す人も迷いません。

## Part 2: 技術者向け

- `page.tsx` は `safeServerFetch` による 3 endpoint 取得と `AdminPageHeader` 描画だけを持つ。
- `AttendanceDashboardSections.client.tsx` を新設し、`AdminTableColumn` の `accessor` / `render` / `getRowKey` 関数を client boundary 内に閉じる。
- `KpiGrid` は `AdminDashboardView["totals"]` 固定のため使わず、`KpiCard` を 3 枚配置する。
- `AdminEmptyState` に `testId` prop は無いため、固定 `data-testid="admin-empty-state"` と表示文言で検証する。
- API / D1 / response shape は変更しない。

## Part 3: 実装完了サマリ (2026-05-26)

### 変更ファイル

| 種別 | パス |
|------|------|
| 編集 | `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` (fetch owner + AdminPageHeader へ縮小、inline KpiCard / 裸 table を削除) |
| 新規 | `apps/web/app/(admin)/admin/dashboard/attendance/AttendanceDashboardSections.client.tsx` (KpiCard×3 + AdminTable×2 + AdminSectionErrorClient + AdminEmptyState の client island) |
| 新規 | `apps/web/app/(admin)/admin/dashboard/attendance/__tests__/page.spec.tsx` (T-D-01..D-04, 9 tests) |
| 編集 | `apps/web/src/features/admin/components/index.ts` (`_shared` から `AdminTable` / `AdminEmptyState` / `AdminSectionErrorClient` を追記方式で再 export) |
| 編集 | `scripts/verify-primitive-adoption.sh` (C7 grep gate: attendance page primitive 採用検査) |
| 編集 | `apps/web/playwright/fixtures/auth.ts` (attendance dashboard mock API scenario を追加) |
| 新規 | `apps/web/playwright/tests/admin-attendance-dashboard.spec.ts` (Phase 11 screenshot 3 状態を取得) |

### ローカル検証結果

- `pnpm --filter @ubm-hyogo/web typecheck` ✅ green
- `pnpm --filter @ubm-hyogo/web lint` ✅ green
- `pnpm exec vitest run apps/web/app/(admin)/admin/dashboard/attendance/__tests__/page.spec.tsx` ✅ 9/9 pass
- `bash scripts/verify-primitive-adoption.sh` ✅ PASS (C1〜C7 全 OK)
- `PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/admin-ui-task-d-attendance-primitive-conformance/outputs/phase-11/evidence pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/admin-attendance-dashboard.spec.ts --project=desktop-chromium` ✅ 3/3 pass

### Phase 11 Screenshot Evidence

| 状態 | Path |
|------|------|
| all OK | `outputs/phase-11/screenshots/attendance-all-ok.png` |
| overview error | `outputs/phase-11/screenshots/attendance-overview-error.png` |
| by-session empty | `outputs/phase-11/screenshots/attendance-by-session-empty.png` |

### AC mapping

- AC-D1 (AdminPageHeader 採用): page.tsx に `<AdminPageHeader title="出席分析" .../>`
- AC-D2 (breadcrumbs): `[{ ダッシュボード, /admin }, { 出席分析 }]`
- AC-D3 (KpiCard ×3): client island で `attendance-kpi-{total-sessions,total-members,overall-rate}`
- AC-D4 (by-session AdminTable): caption + sortable columns + defaultSort `heldOn desc`
- AC-D5 (ranking AdminTable): caption + defaultSort `rate desc`
- AC-D6 (新規 endpoint 追加なし): `apps/api/src/routes/admin/dashboard.ts` diff = 0
- AC-D7 (fail-soft): 3 region 独立で AdminSectionErrorClient
- AC-D8 (a11y): page root `aria-label="出席分析"` + group `aria-label="出席サマリー"` + AdminTable caption
- AC-D9 (testid 安定): `attendance-overview` / `attendance-by-session` / `attendance-ranking`

### 残作業 (user-gated)

- staging deploy 後の Playwright visual baseline 撮影 (Task E スコープ)
- commit / push / PR 作成

# Phase 1 — spec-extraction-map（system spec ↔ current code anchor 1:1 対応表）

> system spec（design-tokens / primitives / screen-blueprints-admin）と current code anchor を 1:1 で対応付ける。
> 「どの spec を根拠に、どの実コードを再構成するか」を Phase 2 設計の入力として固定する。

## A. route / state owner（current code anchor）

| 役割 | anchor（current code） | 説明 |
| --- | --- | --- |
| route owner | `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` | `force-dynamic`。`searchParams` → `readFilterFromQuery()` でフィルタ抽出。`AdminPageHeader`（h1 = `admin-attendance-analytics-h`）+ `AttendanceAnalyticsPage` をレンダリング。**ルート `<section>` が既に `attendance-analytics-page` クラスと `data-testid="attendance-analytics-page"` を持つ** → `AttendanceAnalyticsPage` 内部の同名 div と二重になっている（Phase 2 で整理対象） |
| 状態 owner（データ） | `apps/web/src/features/admin/attendance/components/AttendanceAnalyticsPage.tsx` | async server component。`fetchAttendanceAnalyticsBundle()` で 6 endpoint を並列取得。`SafeResult` をゾーン単位 degrade |
| 状態 owner（フィルタ） | `apps/web/src/features/admin/attendance/hooks/useAttendanceFilters.ts` | client hook。URL searchParams 駆動の filter state（`setPreset` / `toggleZone`）。**本タスクで変更しない** |
| 状態 owner（タブ選択・新規） | `AttendanceDetailTabs.tsx`（新規） | DETAIL タブ選択を `useState` で保持（internal state・[VSCPKR-03]） |
| データ取得 | `apps/web/src/lib/admin/fetch-attendance.ts` | `fetchAttendanceAnalyticsBundle(f)` + `fetchAttendanceSessionDetail` + `buildAttendanceExportUrl`。`safeServerFetch` 経由（D1 直接禁止）。**変更しない** |
| token 正本 | `apps/web/src/styles/tokens.css` | OKLch `--ubm-color-*` / 4px grid `--ubm-space-*` / `--ubm-radius-*` / `--ubm-text-*` / `--ubm-shadow-*` |
| スタイル実体 | `apps/web/src/styles/globals.css` の `.attendance-*`（63 セレクタ） | 3 層レイアウト用クラスの追加・リズム調整対象 |

## B. system spec ↔ 対象 view（8 コンポーネント）

| system spec 正本 | 規定内容 | 対応 current view | 再構成方針 |
| --- | --- | --- | --- |
| `docs/00-getting-started-manual/specs/09b-design-tokens.md` | OKLch token 値 JSON / HEX 禁止 | 全 `.attendance-*` クラス + 各コンポーネント | 色は `var(--ubm-color-*)`、余白は `var(--ubm-space-*)`、特大数値は `--ubm-text-3xl`（AC-5） |
| `docs/00-getting-started-manual/specs/09c-primitives.md` | primitive catalog（`Card` / `Badge` / `Stat` / `Segmented` / `EmptyState` / `AdminSectionCard`） | KPI（`Stat`）/ 要フォロー（`Badge`）/ DETAIL タブ（`Segmented`）/ ゾーン見出し（`AdminSectionCard`） | 既存 primitive のみ再利用（AC-6）。`apps/web/src/components/ui/{Card,Badge,Stat,Segmented,EmptyState}.tsx`（PascalCase パス） |
| `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` | admin 画面 contract（ヘッダ / breadcrumb / セクション構造） | `AdminPageHeader`（route owner）+ 3 ゾーン構造 | h1 = ページ（`AdminPageHeader`）、h2 = ゾーン、h3 = ゾーン内サブ（AC-2） |

### B-1. PRIMARY ゾーン（spec ↔ code）

| spec 根拠 | current code | 再構成 |
| --- | --- | --- |
| 09c primitives `Stat`（label/value/delta/tone/helpText）/ 09b `--ubm-text-3xl` | `KpiPanel.tsx`（5 枚 KPI を `attendance-kpi-card` で均等表示） | ①全体出席率を特大 primary（`--ubm-text-3xl` + delta + ユニーク率）、残りを secondary に分離 |
| 09c primitives `Badge`(tone) / issue-1112 `data-attendance-level` | `AttendanceAbsenteeAlert.tsx`（`<details open>` リスト） | ②要フォロー対象を PRIMARY 2 枚目に主役化。件数トーン（0 = neutral/ok、1+ = warn）。詳細リストは PRIMARY から展開 |

### B-2. TREND ゾーン（spec ↔ code）

| spec 根拠 | current code | 再構成 |
| --- | --- | --- |
| 09c primitives `Card` / `AdminSectionCard`（title/description） | `AttendanceTrendChart.tsx` + `AttendanceZoneDistributionChart.tsx`（現状 `attendance-charts-grid` 2 カラム） | 2 カラム grid を TREND ゾーンに集約・カード化統一（h2 = 「傾向」） |

### B-3. DETAIL ゾーン（spec ↔ code）

| spec 根拠 | current code | 再構成 |
| --- | --- | --- |
| 09c primitives `Segmented`（options/value/onChange/ariaLabel・`role="radiogroup"`） | `SessionAttendanceTable.tsx` / `MemberAttendanceTable.tsx` / `AttendanceTop10Ranking.tsx`（現状 3 個別 h2 セクション） | `AttendanceDetailTabs`（新規）で Segmented タブ統合。internal state で 3 表を排他表示（AC-3） |

## C. 不変条件 ↔ anchor（守る場所）

| 不変条件 / AC | 守る anchor | 守り方 |
| --- | --- | --- |
| #5（D1 直接禁止） | `fetch-attendance.ts` | `safeServerFetch` 経由のまま。D1 binding 不使用 |
| ui-prototype #1 / AC-7 | `apps/api/` / `packages/shared/` | diff ゼロ。6 endpoint surface・shared 型を変更しない |
| ui-prototype #2 / AC-5 | `globals.css` `.attendance-*` / 各コンポーネント | `var(--ubm-color-*)` のみ。HEX ゼロ（`verify-design-tokens`） |
| ui-prototype #3 / AC-6 | `apps/web/src/components/ui/` | 新規 primitive ファイル追加ゼロ |

## D. パッケージ名・コマンド前提（実確認済み）

| 項目 | 実値 |
| --- | --- |
| web パッケージ名 | `@ubm-hyogo/web`（`apps/web/package.json#name` 実確認済み） |
| typecheck | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` |
| token gate | `grep -rnE "#[0-9a-fA-F]{3,6}\|bg-\[#\|text-\[#" apps/web/src/features/admin/attendance` が 0 件 |
| vitest（対象限定） | `mise exec -- pnpm exec vitest run apps/web/src/features/admin/attendance --root .` |

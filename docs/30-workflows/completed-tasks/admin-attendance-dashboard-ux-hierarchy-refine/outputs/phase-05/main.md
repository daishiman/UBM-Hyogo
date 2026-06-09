# Phase 5 — 実装方針概要（CONST_005 集約）

> 上流: `outputs/phase-02/component-map.md` / `outputs/phase-02/layout-blueprint.md` / `outputs/phase-04/test-plan.md`。
> 手順詳細（スケルトン / CSS / MINOR 解消）は `./runbook.md`。本ファイルは CONST_005 の俯瞰。

## 1. 実装方針（要約）

8 セクション縦積みを **3 ゾーン（PRIMARY / TREND / DETAIL）** に再配置する。データ取得（`fetchAttendanceAnalyticsBundle` 6 endpoint）と shared 型は不変。表現層（`apps/web/src/features/admin/attendance/` + `globals.css`）のみを変更する。

- **PRIMARY**: `KpiPanel`（出席率特大 hero + secondary KPI 行）+ `AttendanceAbsenteeAlert`（要フォロー hero / `data-attendance-follow` トーン）の 2 枚 grid。
- **TREND**: `AttendanceTrendChart` + `AttendanceZoneDistributionChart`（描画不変・カード統一）の 2 カラム。
- **DETAIL**: 新規 `AttendanceDetailTabs`（Segmented internal state）で `SessionAttendanceTable` / `MemberAttendanceTable` / `AttendanceTop10Ranking` を排他タブ統合。
- フィルタバーは PRIMARY 直上に据え置き。

## 2. 変更対象ファイル一覧（CONST_005 必須項目 ①）

| # | パス | 種別 | 概要 |
| --- | --- | --- | --- |
| 1 | `apps/web/src/features/admin/attendance/lib/attendance-follow-level.ts` | **新規** | 純粋関数 `attendanceFollowLevel` |
| 2 | `apps/web/src/features/admin/attendance/components/AttendanceDetailTabs.tsx` | **新規** | DETAIL タブホスト（Segmented + useState） |
| 3 | `apps/web/src/features/admin/attendance/components/AttendanceAnalyticsPage.tsx` | 編集 | 3 ゾーン分配へ統括組み替え（再構成の主役） |
| 4 | `apps/web/src/features/admin/attendance/components/KpiPanel.tsx` | 編集 | hero（出席率特大）+ secondary 分離 |
| 5 | `apps/web/src/features/admin/attendance/components/AttendanceAbsenteeAlert.tsx` | 編集 | hero 化 + `data-attendance-follow` トーン |
| 6 | `apps/web/src/styles/globals.css` | 編集 | `.attendance-*` 3 層クラス追加 + リズム調整 |
| 7 | `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` | 編集（MINOR M-1） | route 二重 className / testid 整理 |
| 8 | `apps/web/src/features/admin/attendance/__tests__/attendanceFollowLevel.spec.ts` | **新規** | TC-01〜TC-03b |
| 9 | `apps/web/src/features/admin/attendance/__tests__/AttendanceDetailTabs.spec.tsx` | **新規** | TC-04〜TC-10, TC-16 |
| 10 | `apps/web/src/features/admin/attendance/__tests__/AttendancePrimaryHero.spec.tsx` | **新規** | TC-13, TC-14, TC-15, TC-17 |
| 11 | `apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx` | 編集（追従） | TC-11, TC-12, TC-11b |

**変更しない（AC-7 / AC-10）**: `apps/api/**`、`packages/shared/**`、`fetch-attendance.ts`、`useAttendanceFilters.ts`、`read-attendance-filter.ts`、`format-attendance.ts`、`AttendanceDrilldownModal.tsx`、`AttendanceFilterBar.tsx`、`AttendanceTrendChart.tsx`、`AttendanceZoneDistributionChart.tsx`、`SessionAttendanceTable.tsx`、`MemberAttendanceTable.tsx`、`AttendanceTop10Ranking.tsx`、`buildExportUrlClient.ts`。

## 3. 関数・型・コンポーネント シグネチャ（CONST_005 ②）

```ts
// 1. 純粋関数（lib/attendance-follow-level.ts）
export type AttendanceFollowLevel = "none" | "warn";
export function attendanceFollowLevel(count: number): AttendanceFollowLevel;

// 2. DETAIL タブホスト（components/AttendanceDetailTabs.tsx）
export type DetailTabKey = "session" | "member" | "top10";
export interface AttendanceDetailTabsProps {
  readonly bySession: SafeResult<readonly SessionAttendanceRowView[]>;
  readonly ranking: SafeResult<readonly MemberAttendanceRankingView[]>;
  readonly initialTab?: DetailTabKey; // 既定 "session"
}
export function AttendanceDetailTabs(props: AttendanceDetailTabsProps): JSX.Element;
```

- 新規型は `DetailTabKey` / `AttendanceFollowLevel`（feature 層 local 型）のみ。**shared 型を追加しない（AC-7）**。
- `KpiPanel` / `AttendanceAbsenteeAlert` の props 型シグネチャは**変更しない**（既存 `Props` のまま hero 化）。

## 4. 入出力・副作用（CONST_005 ③）

| 単位 | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `attendanceFollowLevel` | `count: number` | `"none"`（count<=0）/ `"warn"`（count>=1） | なし（純粋・throw なし） |
| `AttendanceDetailTabs` | `bySession` / `ranking`（SafeResult）/ `initialTab` | 選択タブの表 1 つ + Segmented | `useState`（タブ選択）のみ。fetch しない |
| `KpiPanel`（hero 化） | `overview` / `attendeeCount` | hero（出席率特大）+ secondary KPI | なし（pure render） |
| `AttendanceAbsenteeAlert`（hero 化） | `data`（AttendanceAbsenteeList） | hero + `data-attendance-follow` 属性 + details | なし |
| `AttendanceAnalyticsPage` | `filterState` | 3 ゾーン DOM | `await fetchAttendanceAnalyticsBundle`（既存・不変） |

## 5. テスト方針（CONST_005 ④）

- 追加 spec 3 本 + KpiPanel 追従 1 本（`./runbook.md` §テスト / `phase-04/test-plan.md` §7）。
- ケース: TC-01〜TC-20（Phase 4）+ TC-E-XX（Phase 6 fail path）。
- 書式: happy-dom + testing-library + `afterEach(cleanup)`、`fireEvent.click`、`vi.stubGlobal` 不使用。

## 6. ローカル実行コマンド（CONST_005 ⑤）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm exec vitest run apps/web/src/features/admin/attendance --root .
mise exec -- pnpm --filter @ubm-hyogo/web exec next build --webpack
bash -lc 'grep -rnE "#[0-9a-fA-F]{3,6}|bg-\[#|text-\[#" apps/web/src/features/admin/attendance apps/web/src/styles/globals.css && echo "FAIL" || echo "PASS"'
```

## 7. DoD（CONST_005 ⑥）

- [ ] 新規 2 ファイル（`attendance-follow-level.ts` / `AttendanceDetailTabs.tsx`）+ 編集 5 ファイルが runbook 通り実装されている
- [ ] Phase 4 の TC-01〜TC-20 が Green（vitest 対象限定 pass）
- [ ] typecheck / lint pass
- [ ] `next build --webpack` 成功（OpenNext 互換）
- [ ] HEX grep gate が PASS（`apps/web/src/features/admin/attendance` + `globals.css` 追加分に HEX ゼロ）
- [ ] `apps/api/**` / `packages/shared/**` の diff がゼロ（`git diff --stat` で確認）
- [ ] `components/ui/` への新規追加ゼロ（AC-6）
- [ ] フィルタ / CSV / ドリルダウン modal / フッター / SafeResult degrade が挙動不変
- [ ] MINOR M-1（route 二重）/ M-2（命名分離）が解消されている

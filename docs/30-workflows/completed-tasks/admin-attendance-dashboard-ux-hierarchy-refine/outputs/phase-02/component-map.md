# Phase 2 — component-map（Before/After 責務 + 新規タブホスト signature）

> 上流: `./main.md` / `./layout-blueprint.md`。後続実装者の「新規/修正ファイル一覧」入力。

## 1. Before / After 責務テーブル

| コンポーネント | Before（current 責務） | After（再構成後 責務） | 配置ゾーン |
| --- | --- | --- | --- |
| `AttendanceAnalyticsPage.tsx` | 6 endpoint bundle 取得 + 8 セクション縦積み統括 | bundle 取得は不変。**PRIMARY / TREND / DETAIL の 3 ゾーンへ分配**。内部 div 二重を整理（D-1） | 統括 |
| `KpiPanel.tsx` | 5 枚 KPI を均等グリッド表示 | **PRIMARY hero（出席率特大 `--ubm-text-3xl` + delta + ユニーク率）と secondary KPI 行に分離**。既存 testid 維持 | PRIMARY ① |
| `AttendanceAbsenteeAlert.tsx` | `<details open>` リスト（縦積み末尾） | **PRIMARY 2 枚目 hero に格上げ**。件数で `data-attendance-follow`（none/warn）トーン。詳細は details 展開 | PRIMARY ② |
| `AttendanceTrendChart.tsx` | 月別 SVG 折れ線（2 カラム左） | TREND ゾーンへ移設・`AdminSectionCard` でカード統一（描画内容不変） | TREND 左 |
| `AttendanceZoneDistributionChart.tsx` | 回数帯横棒（2 カラム右） | TREND ゾーンへ移設・カード統一（描画内容不変） | TREND 右 |
| `SessionAttendanceTable.tsx` | セッション別表 + modal（独立セクション） | **DETAIL タブ「セッション別」の body**（modal 挙動不変） | DETAIL タブ 1 |
| `MemberAttendanceTable.tsx` | 会員別表（独立セクション） | **DETAIL タブ「会員別」の body**（描画不変） | DETAIL タブ 2 |
| `AttendanceTop10Ranking.tsx` | TOP10（独立セクション） | **DETAIL タブ「TOP10」の body**（描画不変） | DETAIL タブ 3 |
| `AttendanceDrilldownModal.tsx` | 出席/欠席者 modal | **触れない（挙動不変で温存）** | DETAIL タブ 1 内 |
| `AttendanceFilterBar.tsx` | 期間 / 回数帯 / CSV | **不変**（PRIMARY 直上に配置のまま） | フィルタ |
| `AttendanceDetailTabs.tsx`（新規） | — | **DETAIL ゾーンの Segmented タブホスト**（internal state で 3 表を排他描画） | DETAIL 統括 |

## 2. 新規コンポーネント `AttendanceDetailTabs` の props / state signature

配置: `apps/web/src/features/admin/attendance/components/AttendanceDetailTabs.tsx`（PascalCase / `Attendance` prefix・命名規則整合）。

```ts
"use client"; // Segmented onClick / useState を使うため client component

import { useState } from "react";
import type { SafeResult } from "@/lib/result";
import type {
  SessionAttendanceRowView,
  MemberAttendanceRankingView,
} from "@ubm-hyogo/shared"; // 既存 shared 型のみ・新規型を作らない（AC-7）

export type DetailTabKey = "session" | "member" | "top10";

export interface AttendanceDetailTabsProps {
  readonly bySession: SafeResult<SessionAttendanceRowView[]>;
  readonly ranking: SafeResult<MemberAttendanceRankingView[]>;
  readonly initialTab?: DetailTabKey; // 既定 "session"
}

export function AttendanceDetailTabs(props: AttendanceDetailTabsProps): JSX.Element {
  // [VSCPKR-03] タブ選択は internal state（外部 props ではない）
  const [activeTab, setActiveTab] = useState<DetailTabKey>(props.initialTab ?? "session");
  // ...
}
```

### state / props 設計判断

| 項目 | 決定 | 根拠 |
| --- | --- | --- |
| タブ選択状態 | `useState<DetailTabKey>`（internal） | [VSCPKR-03]。親から制御しない |
| props で受ける型 | 既存 `SafeResult<SessionAttendanceRowView[]>` / `SafeResult<MemberAttendanceRankingView[]>` | AC-7。新規型を作らない |
| degrade | props の `SafeResult.ok` を各タブ body で分岐し `AdminSectionErrorClient` 表示 | AC-10 |
| 描画 | 既存 `SessionAttendanceTable` / `MemberAttendanceTable` / `AttendanceTop10Ranking` をそのまま埋め込み | 表内容不変 |
| Segmented 配線 | `options=[{value:"session",label:"セッション別"},...]` / `value=activeTab` / `onChange=setActiveTab` / `ariaLabel="出席詳細の表示切替"` | 既存 `Segmented` API |

### Segmented options（DETAIL タブ）

| value | label | body |
| --- | --- | --- |
| `session` | セッション別 | `bySession.ok` → `SessionAttendanceTable` / else → `AdminSectionErrorClient` |
| `member` | 会員別 | `ranking.ok` → `MemberAttendanceTable` / else → `AdminSectionErrorClient` |
| `top10` | TOP10 | `ranking.ok` → `AttendanceTop10Ranking` / else → `AdminSectionErrorClient` |

> `member` / `top10` は `ranking` 共通 source。ranking error 時は両タブが同一 error を表示。

## 3. props 受け渡し（再構成後）

```
page.tsx
 └─ AttendanceAnalyticsPage(filterState)  [server]
     │  bundle = await fetchAttendanceAnalyticsBundle(...)
     ├─ AttendanceFilterBar(initial=filterState)                      [client・不変]
     ├─ <PRIMARY zone>
     │   ├─ KpiPanel(overview=bundle.overview.data, attendeeCount)    [hero 化]
     │   └─ AttendanceAbsenteeAlert(data=bundle.absentees.data)       [hero 化 + data-attendance-follow]
     ├─ <TREND zone>
     │   ├─ AttendanceTrendChart(trend=bundle.trend.data)             [Card 化]
     │   └─ AttendanceZoneDistributionChart(data=bundle.zoneDistribution.data)
     └─ <DETAIL zone>
         └─ AttendanceDetailTabs(                                     [新規・client]
              bySession=bundle.bySession,
              ranking=bundle.ranking,
            )
             ├─ (tab session) SessionAttendanceTable(rows)            [+ AttendanceDrilldownModal 不変]
             ├─ (tab member)  MemberAttendanceTable(rows)
             └─ (tab top10)   AttendanceTop10Ranking(rows)
```

> 注: `AttendanceDetailTabs` は client component（`useState` + Segmented onClick）。`SafeResult` 全体を props で受け、タブ body で `.ok` 分岐する（server 側で data を抜き出さず SafeResult を渡すことで degrade をタブ内に閉じる）。`SessionAttendanceTable` は既に client（modal 用 `useState`）なので入れ子整合に問題なし。

## 4. 既存 primitive 対応

| コンポーネント | 使用する既存 primitive |
| --- | --- |
| `KpiPanel`（hero 化後） | `Stat`（出席率 hero）/ 既存 `.attendance-kpi-*` を secondary 行に流用 |
| `AttendanceAbsenteeAlert`（hero 化後） | `Badge`（tone: success/warning）+ `data-attendance-follow` + native `<details>` |
| `AttendanceTrendChart` / `AttendanceZoneDistributionChart` | `AdminSectionCard` / `Card`（サーフェス統一） |
| `AttendanceDetailTabs` | `Segmented`（タブ）+ `AdminSectionErrorClient`（degrade）+ `EmptyState`（0 件・既存各表が内包） |
| 全ゾーン見出し | `AdminSectionCard`（title/description）または素の `<h2>` + クラス |

## 5. 新規 / 修正ファイル一覧（Phase 5 runbook 入力）

| 区分 | パス | 内容 |
| --- | --- | --- |
| 新規 | `apps/web/src/features/admin/attendance/components/AttendanceDetailTabs.tsx` | DETAIL タブホスト（Segmented + internal state） |
| 新規 | `apps/web/src/features/admin/attendance/lib/attendance-follow-level.ts`（任意） | `attendanceFollowLevel(count): "none" | "warn"` 純粋関数 |
| 修正 | `apps/web/src/features/admin/attendance/components/AttendanceAnalyticsPage.tsx` | 3 ゾーン分配へ統括組み替え |
| 修正 | `apps/web/src/features/admin/attendance/components/KpiPanel.tsx` | PRIMARY hero + secondary 分離 |
| 修正 | `apps/web/src/features/admin/attendance/components/AttendanceAbsenteeAlert.tsx` | hero 化 + トーン |
| 修正 | `apps/web/src/styles/globals.css` | 3 層クラス追加・リズム調整 |
| 修正（追従） | `apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx` ほか | レイアウト変更分の spec 追従 + 新規 spec（DETAIL タブ / 要フォロートーン） |
| **変更なし** | `apps/api/**` / `packages/shared/**` / `fetch-attendance.ts` / `useAttendanceFilters.ts` / `AttendanceDrilldownModal.tsx` | AC-7 / AC-10 |

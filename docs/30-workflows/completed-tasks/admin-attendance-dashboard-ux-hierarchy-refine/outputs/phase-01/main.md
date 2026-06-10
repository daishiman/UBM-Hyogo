# Phase 1 要件定義 — main

> 正本: `../../_shared-context.md`。本ファイルは Phase 1 の要件確定実体。

## Step 0: P50 前提確認（実装状態の git/grep 確認）

| 確認項目 | 結果 |
| --- | --- |
| current branch に実装が存在するか | **Yes** — `/admin/dashboard/attendance` は既に稼働中。route owner `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` が `AdminPageHeader` + `AttendanceAnalyticsPage` をレンダリングしている |
| 現状の構造 | **8 セクションのフラット縦積み**。`AttendanceAnalyticsPage.tsx` は上から順に ①ガイド文 → ②`AttendanceFilterBar` → ③`KpiPanel`（5 枚 KPI）→ ④2 カラム grid（`AttendanceTrendChart` / `AttendanceZoneDistributionChart`）→ ⑤`SessionAttendanceTable` → ⑥`MemberAttendanceTable` → ⑦`AttendanceTop10Ranking` → ⑧`AttendanceAbsenteeAlert` を `<h2>` 並列で縦積みしている |
| upstream（dev / main）にマージ済みか | 既存実装は merge 済み。**本タスクは表現層（component 再構成 + globals.css）の上書き再構成**であり、新規ファイル追加は新規タブホスト 1 件のみ |
| 前提タスク完了済みか | **Yes** — ui-prototype-alignment（tokens / primitives 正本）・issue-1112（`data-attendance-level` パターン）が完了済み。依存解消タスク不要 |

> **結論**: 本タスクは「データ供給は完備しているが UI 表現層が情報過多」という問題への表現層再構成。`implementation_mode = new`（RED/GREEN で再構成を実装）だが、データ取得・型・endpoint は既存をそのまま使うため、Phase 5 の実装範囲は `apps/web/src/features/admin/attendance/` 配下と `globals.css` に閉じる。

## Inventory（対象資産）

### 対象コンポーネント（全て `apps/web/src/features/admin/attendance/components/`）

| # | コンポーネント | ファイル | current 役割 | 本タスクの改修方針 |
| --- | --- | --- | --- | --- |
| 1 | `AttendanceAnalyticsPage` | `AttendanceAnalyticsPage.tsx` | 6 endpoint bundle を受け 8 セクション縦積みを統括（async server component） | **再構成の主役**。PRIMARY / TREND / DETAIL の 3 層へ組み替え |
| 2 | `AttendanceFilterBar` | `AttendanceFilterBar.tsx` | 期間プリセット / 回数帯チェック / CSV（client） | 据え置き。位置のみ PRIMARY 直上に維持（内容不変） |
| 3 | `KpiPanel` | `KpiPanel.tsx` | 5 枚 KPI カード（内部 `Card` ローカル関数） | PRIMARY ヒーロー（特大 primary KPI + secondary KPI）へ再編 |
| 4 | `AttendanceTrendChart` | `AttendanceTrendChart.tsx` | 月別 SVG 折れ線 | TREND ゾーンへ移設・カード化統一 |
| 5 | `AttendanceZoneDistributionChart` | `AttendanceZoneDistributionChart.tsx` | 回数帯 横棒 | TREND ゾーンへ移設・カード化統一 |
| 6 | `SessionAttendanceTable` | `SessionAttendanceTable.tsx` | セッション別表 + ドリルダウン modal（client / 内部 `useState`） | DETAIL タブの 1 つへ |
| 7 | `MemberAttendanceTable` | `MemberAttendanceTable.tsx` | 会員別出席率表 | DETAIL タブの 1 つへ |
| 8 | `AttendanceTop10Ranking` | `AttendanceTop10Ranking.tsx` | TOP10 ランキング（SVG バー） | DETAIL タブの 1 つへ |
| 9 | `AttendanceAbsenteeAlert` | `AttendanceAbsenteeAlert.tsx` | 要フォロー `<details>` リスト | PRIMARY からの展開（要フォロー対象の主役化・件数トーン強調） |
| 10 | `AttendanceDrilldownModal` | `AttendanceDrilldownModal.tsx` | 出席/欠席者 modal | 挙動不変で温存（触れない） |
| 11 | （新規）`AttendanceDetailTabs` | `AttendanceDetailTabs.tsx`（新規作成） | DETAIL ゾーンの Segmented タブホスト | Phase 2 で props/state 設計 |

### スタイリング

| 対象 | パス | 本タスクの扱い |
| --- | --- | --- |
| `.attendance-*` 系（63 セレクタ） | `apps/web/src/styles/globals.css`（`.attendance-analytics-page` 行752〜 / `.attendance-kpi-grid` 行853〜 / `.attendance-charts-grid` 行892〜 ほか） | 3 層レイアウト用クラス追加・既存クラスのリズム（余白/タイポ/トーン）調整 |
| design token 正本 | `apps/web/src/styles/tokens.css` | 参照のみ（token 追加なし）。色 OKLch / 余白 4px grid |

### 既存テスト（`apps/web/src/features/admin/attendance/__tests__/`）

| # | ファイル | 種別 | 本タスクの扱い |
| --- | --- | --- | --- |
| 1 | `KpiPanel.spec.tsx` | component spec | PRIMARY ヒーロー再編に追従（testid `attendance-kpi-rate` 等の維持/更新を Phase 4 で確定） |
| 2 | `AttendanceTrendChart.spec.tsx` | component spec | TREND 移設後も挙動不変（追従確認） |
| 3 | `AttendanceZoneDistributionChart.spec.tsx` | component spec | TREND 移設後も挙動不変（追従確認） |
| 4 | `format-attendance.spec.ts` | lib spec | 変更なし（`formatRate` / `formatDelta` を維持） |
| 5 | `buildExportUrl.spec.ts` | lib spec | 変更なし（CSV URL 不変） |

> 注: prompt 指定の「既存テスト 5 本」は上記 5 ファイル。うち component spec は 3 本、lib spec は 2 本。`SessionAttendanceTable` / `MemberAttendanceTable` / `AttendanceTop10Ranking` / `AttendanceAbsenteeAlert` には現状 spec が無く、Phase 4/6 で DETAIL タブ統合 + 要フォロー主役化の新規 spec を追加する。

## 命名規則（current コードベース分析）

| 対象 | 規則 | 実例 |
| --- | --- | --- |
| React コンポーネント | **PascalCase**（ファイル名 = export 名） | `KpiPanel.tsx` → `KpiPanel`、`SessionAttendanceTable.tsx` → `SessionAttendanceTable`、新規 `AttendanceDetailTabs.tsx` → `AttendanceDetailTabs` |
| 関数・ヘルパ | **camelCase** | `formatRate` / `formatDelta` / `fetchAttendanceAnalyticsBundle` / `attendanceLevel` / `useAttendanceFilters` |
| lib / hooks ファイル | **kebab-case**（一部） | `format-attendance.ts` / `read-attendance-filter.ts` / `fetch-attendance.ts`。ただし hooks は `useAttendanceFilters.ts`（camelCase）も併存 |
| CSS クラス | **`.attendance-*` BEM 風**（`__` element / `--` modifier は admin-section-card 系で使用） | `.attendance-analytics-page` / `.attendance-kpi-grid` / `.attendance-kpi-card` / `.attendance-charts-grid` / `.attendance-session-table`。新規 3 層クラスも `.attendance-*` prefix を踏襲 |
| data 属性 | **kebab-case**、testid は `attendance-*` | `data-testid="attendance-kpi-rate"` / `data-attendance-level`（issue-1112 踏襲） |

> **新規タブホストの命名一貫性（[FB-SDK-07-4]）**: 新規コンポーネントは `AttendanceDetailTabs`（PascalCase・`Attendance` prefix）とし、配置は `apps/web/src/features/admin/attendance/components/AttendanceDetailTabs.tsx`。既存命名規則と完全整合する。

## 受入条件（AC-1〜AC-10）と test 検証手段

| AC | 内容 | test 検証手段 |
| --- | --- | --- |
| **AC-1** | PRIMARY ヒーローが最上部（フィルタバー直下）に配置され、①全体出席率（`--ubm-text-3xl`）+ 前期比 delta（`formatDelta`）+ ユニーク出席率、②要フォロー対象数を主役 2 枚として構成 | component spec で PRIMARY ゾーンに出席率 / delta / ユニーク率 / 要フォロー数が描画されることを assert |
| **AC-2** | 視覚的階層が 3 層（PRIMARY / TREND / DETAIL）に明確化。見出しレベル（h1 ページ > h2 ゾーン > h3 サブ）・余白・サーフェスで区別 | DOM 構造 assert（各ゾーンの `data-zone` / `<h2>` 階層の存在確認） |
| **AC-3** | DETAIL の 3 テーブル（セッション別 / 会員別 / TOP10）が既存 `Segmented` タブ切替で 1 領域に統合され、初期スクロール量が削減 | `AttendanceDetailTabs` spec で内部 state によるタブ排他表示を assert（internal state） |
| **AC-4** | 要フォロー対象が PRIMARY で視覚強調、件数でトーン変化（0 名 = neutral/ok、1+ = warn）。`data-attendance-level` パターン踏襲、新規 token 追加なし | spec で要フォロー数 0 / 1+ の `data-*` トーン切替を assert |
| **AC-5** | 全色が OKLch トークン経由。HEX / `bg-[#xxx]` / `text-[#xxx]` ゼロ | `grep -rnE "#[0-9a-fA-F]{3,6}|bg-\[#|text-\[#"` で 0 件（`verify-design-tokens` gate） |
| **AC-6** | 新規 primitive 追加ゼロ（`Card` / `Badge` / `Stat` / `Segmented` / `EmptyState` / `AdminSectionCard` 再利用） | `apps/web/src/components/ui/` への新規ファイル追加 diff が 0 件 |
| **AC-7** | API / D1 / Form / shared 型の変更ゼロ。`apps/api` / `packages/shared` の diff ゼロ。6 endpoint surface のまま | `git diff --name-only` に `apps/api/` `packages/shared/` が 0 件 |
| **AC-8** | レスポンシブ維持（モバイル縦積み 1col → デスクトップ多カラム）を既存 grid utility で成立 | spec で `grid-cols-1 lg:grid-cols-2` 相当クラスの存在を assert |
| **AC-9** | アクセシビリティ維持・向上（論理的見出し階層 / aria-label / フォーカスリング / WCAG 2 AA） | spec で `aria-label` / `aria-labelledby` の存在 assert + Phase 11 で視覚コントラスト確認 |
| **AC-10** | 既存全機能が挙動不変で温存（フィルタ / CSV / ドリルダウン modal / テーブル内容 / フッター / SafeResult degrade） | 既存 spec の回帰 PASS + フィルタ / CSV / modal の挙動 spec |

## VISUAL タスク宣言

- 本タスクは **VISUAL タスク**（UI/UX 表現層の変更を伴う）。
- Phase 11 で screenshot を取得する。`screenshot-plan.json` は `mode: "VISUAL"` をデフォルトとし、`phase11-capture-metadata.json` の `taskId` を `admin-attendance-dashboard-ux-hierarchy-refine` に一致させる（[Feedback W1-02b-1]）。
- Phase 11 着手時に本宣言を必ず参照し、分類変更があれば再判定を明示する（[Feedback 3]）。
- capture 対象: `/admin/dashboard/attendance`（staging 認証済み admin）。状態 = 通常（データあり）/ 要フォロー 0 名 / DETAIL 各タブ切替 / モバイル幅。

## スコープ外（今サイクルでは扱わない）

| 項目 | 除外理由 |
| --- | --- |
| 会員ごとの直近 N 回セッション出席フラグの一覧表示 | 新 endpoint（サーバ集計）が必要 → invariant ui-prototype #1 / AC-7 違反 |
| 月別「出席率」=延べ÷(セッション×総員) のサーバ集計 | 同上（新 endpoint 必要） |
| 新規 UI primitive の追加 | AC-6 / ui-prototype #3 違反 |
| API / D1 schema / Google Form schema / `packages/shared` 型の変更 | AC-7 / 不変条件 #5 違反 |

> 上記はスコープ外として明記するのみ。未タスク化（backlog 起票）の判断は Phase 12 で行う（[FB-CRONVL-002] 将来 UI 統合経路 = 未タスク化候補として Phase 12 で評価）。

## handoff（Phase 2 へ）

1. 3 層 topology（PRIMARY / TREND / DETAIL）に組み替える主役は `AttendanceAnalyticsPage.tsx`。
2. 新規タブホスト `AttendanceDetailTabs`（PascalCase / `Attendance` prefix）の props/state は Phase 2 で設計。Segmented のモード管理は internal `useState`（[VSCPKR-03]）。
3. 状態所有権: navigation 不変 / filter state は既存 `useAttendanceFilters` のまま / タブ選択のみ新規 internal state。
4. 既存 primitive のみ使用（`Card` / `Badge` / `Stat` / `Segmented` / `EmptyState` / `AdminSectionCard`）。
5. SafeResult error はゾーン単位 degrade（`AdminSectionErrorClient`）を維持。

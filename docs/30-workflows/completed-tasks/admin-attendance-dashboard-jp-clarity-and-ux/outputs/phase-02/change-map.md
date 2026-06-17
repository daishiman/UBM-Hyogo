# Phase 2 — ファイル別変更マップ（change-map）

> **このファイルが Phase 5 実装の唯一の正**。各行は「対象（行アンカー）/ Before / After / 影響 / リネーム ID」。
> 行番号は Read 時点（2026-06-11）の実コード。Phase 5 着手時に `grep` で再確認すること（drift 防止）。
> 全変更は `apps/web` 表現層に閉じる（`apps/api` / `packages/shared` は対象外＝AC-7）。

---

## 1. `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx`

| 行 | 対象 | Before | After | 影響 | ID |
| --- | --- | --- | --- | --- | --- |
| 29 | `AdminPageHeader` の `eyebrow` | `eyebrow="ADMIN / DASHBOARD"` | `eyebrow="管理 / ダッシュボード"` | 画面（パンくず上 overline） | R-01 |
| 31 | `description` | `description="出席率の推移・区画分布・欠席フォロー対象を確認"` | `description="出席率の移り変わり・出席回数べつの分布・要フォロー対象を確認"` | 画面 | J-08 派生 |

> `data-testid="attendance-analytics-page"`（25 行）/ `aria-labelledby` / `headingId` / breadcrumbs の `href` は不変。

---

## 2. `apps/web/src/features/admin/attendance/components/AttendanceAnalyticsPage.tsx`

| 行 | 対象 | Before | After | 影響 | ID |
| --- | --- | --- | --- | --- | --- |
| 30-32 | ページ案内 `<p>` | `期間と出席回数帯で絞り込み、出席率の推移、累計出席回数の分布、要フォロー対象を確認します。` | `期間と累計の出席回数で絞り込み、出席率の移り変わり、出席回数べつの分布、要フォロー対象を確認します。` | 画面 | J-10 / J-08 派生 |
| 37 | PRIMARY h2 | `<h2 id="attendance-primary-heading">PRIMARY</h2>` | `...>全体の状況</h2>` | 画面 | R-02 |
| 46 | KPI degrade sectionLabel | `sectionLabel="出席KPI"` | `sectionLabel="出席のおもな指標"` | degrade 文言 | J-05 |
| 64 | TREND h2 | `<h2 id="attendance-trend-heading">TREND</h2>` | `...>出席の移り変わり</h2>` | 画面 | R-03 |
| 65 | TREND intro | `月別推移と参加回数帯から、参加の偏りを確認します。` | `月ごとの移り変わりと出席回数のはばから、参加のかたよりを確認します。` | 画面 | J-02 |
| 69 | TREND h3（左） | `<h3>出席トレンド</h3>` | `<h3>月ごとの出席の移り変わり</h3>` | 画面 | R-05 |
| 70 | h3 直下 intro | `月別の延べ出席数と開催セッション数の変化を確認します。` | `月ごとの延べ出席数と開催回数の変化を確認します。` | 画面 | S-10 |
| 82 | TREND h3（右） | `<h3>出席回数帯別分布</h3>` | `<h3>出席回数べつの人数</h3>` | 画面 | R-06 |
| 88 | zone degrade sectionLabel | `sectionLabel="区画別分布"` | `sectionLabel="出席回数べつの分布"` | degrade 文言 | J-08 派生 |
| 99 | DETAIL h2 | `<h2 id="attendance-detail-heading">DETAIL</h2>` | `...>くわしい一覧</h2>` | 画面 | R-04 |

> `aria-labelledby` / 各 `id` / `className`（`attendance-zone--primary` 等）/ testid / degrade の `code`・`message` 受け渡しは不変。h2 の `id` 属性値（`attendance-primary-heading` 等）も維持する（aria 参照を壊さない）。

---

## 3. `apps/web/src/features/admin/attendance/components/KpiPanel.tsx`

| 行 | 対象 | Before | After | 影響 | ID |
| --- | --- | --- | --- | --- | --- |
| 49 | rate hint | `前期間比 {formatDelta(...)}` | `前の期間とくらべて {formatDelta(...)}` | 画面 | J-06 |
| 52 | support span | `ユニーク出席率 {formatRate(...)}` | `一度でも参加した人の割合 {formatRate(...)}` | 画面 / **回帰** | J-03 |
| 56 | secondary-grid aria-label | `aria-label="出席KPI補助指標"` | `aria-label="出席のおもな指標"` | aria（SR） | J-04 |
| 59-61 | 延べ出席数 Metric | `label="期間内延べ出席数"` / `hint="セッション別出席者数の合計"` | `label="期間内の出席のべ人数"` / `hint="開催回ごとの出席者数を合計した数"` | 画面 | J-12 |
| 66-67 | 平均 Metric hint | `hint="1 セッションあたり"` | `hint="1回の開催あたり"` | 画面 | S-02 |
| 70-73 | 開催回 Metric | `label="セッション数"` / `hint="期間内の開催数"` | `label="開催回数"` / `hint="この期間の開催回数"` | 画面 / **回帰** | S-01 / S-03 |

> `data-testid`（`attendance-kpi-rate` / `-attendees` / `-avg` / `-sessions` / `-panel`）/ `id="attendance-primary-kpi-heading"` / `formatRate` / `formatDelta` 呼び出し・0除算回避（30-33 行）は不変。`全体出席率`（43 行 label）は据置（既に日本語）。

---

## 4. `apps/web/src/features/admin/attendance/components/AttendanceAbsenteeAlert.tsx`

| 行 | 対象 | Before | After | 影響 | ID |
| --- | --- | --- | --- | --- | --- |
| 21 | empty 文言 | `直近 {data.lastN} セッション連続欠席のメンバーはいません` | `直近 {data.lastN} 回つづけて欠席している人はいません` | 画面 | S-05 |
| 35 | summary 期間 span | `直近 {data.lastN} セッション連続欠席` | `直近 {data.lastN} 回つづけて欠席` | 画面 | S-04 |
| 37-47 | `<li>` リズム（U-01） | （構造維持） | `globals.css` `.attendance-absentee-alert li` の行間 / 区切りを軽微調整（必要時） | CSS（視覚）/ 構造不変 | U-01 |

> `data-attendance-follow`（17 / 28 行・値 `followLevel`）/ `data-testid`（`attendance-absentee-empty` / `-alert`）/ `<li>` 内 span 数・順序 / `ZONE_LABEL` 参照は不変。

---

## 5. `apps/web/src/features/admin/attendance/components/AttendanceDetailTabs.tsx`

| 行 | 対象 | Before | After | 影響 | ID |
| --- | --- | --- | --- | --- | --- |
| 20 | DETAIL_OPTIONS[0] label | `{ value: "session", label: "セッション別" }` | `label: "開催回ごと"` | 画面 / aria-label | S-06 |
| 22 | DETAIL_OPTIONS[2] label | `{ value: "top10", label: "TOP10" }` | `label: "出席が多い順"` | 画面 / aria-label / **テスト T-02** | R-07 |
| 44 | session degrade sectionLabel | `sectionLabel="セッション別出席状況"` | `sectionLabel="開催回ごとの出席状況"` | degrade 文言 / **テスト T-03** | S-07 |
| 65 | top10 degrade sectionLabel | `sectionLabel="出席ランキング TOP 10"` | `sectionLabel="出席が多い人の一覧"` | degrade 文言 / **テスト T-04** | R-08 |

> `value`（`"session" / "member" / "top10"`）/ `useState`（26 行）/ `onChange` / `data-testid="attendance-detail-tabs"` / `Segmented` の `ariaLabel="出席詳細の表示切替"` は不変。`会員別`（21 行 label）と `会員別出席率`（54 行 member sectionLabel）は据置。

---

## 6. `apps/web/src/features/admin/attendance/components/AttendanceFilterBar.tsx`

| 行 | 対象 | Before | After | 影響 | ID |
| --- | --- | --- | --- | --- | --- |
| 42 | zone fieldset legend | `<legend>出席回数帯</legend>` | `<legend>累計の出席回数</legend>` | 画面 | J-10 |
| 64 | export link 文言 | `CSVエクスポート` | `表計算ファイルで書き出す` | 画面 | R-09 |

> `href`（57-61 行 `buildAttendanceExportUrlClient`）/ `download` 属性 / `data-testid="attendance-export-link"` / `role="group"` / `aria-label="出席分析フィルタ"` / 期間 legend（27 行 `期間`・据置）は不変。

---

## 7. `apps/web/src/features/admin/attendance/components/AttendanceTrendChart.tsx`

| 行 | 対象 | Before | After | 影響 | ID |
| --- | --- | --- | --- | --- | --- |
| 12 | empty 文言 | `トレンドデータがありません` | `推移データがありません` | 画面 | J-01 |
| 31 | figure aria-label | `aria-label="出席トレンド"` | `aria-label="出席の移り変わり"` | aria | J-01 |
| 47 | SVG `<title>` | `` `${b.period}: ${b.attendeeCount} 人 / ${b.sessionCount} セッション` `` | `` `${b.period}: ${b.attendeeCount} 人 / 開催 ${b.sessionCount} 回` `` | SVG title（ツールチップ） | S-09 |

> `data-testid`（`attendance-trend-chart` / `-empty`）/ `role="img"` / SVG `aria-label="月別出席者数"`（34 行・据置可、必要なら `月ごとの出席者数`へ任意）/ polyline・circle 描画は不変。

---

## 8. `apps/web/src/features/admin/attendance/components/AttendanceZoneDistributionChart.tsx`

| 行 | 対象 | Before | After | 影響 | ID |
| --- | --- | --- | --- | --- | --- |
| 12 | empty 文言 | `区画別分布データがありません` | `出席回数べつのデータがありません` | 画面 | J-08 |
| 20 | group aria-label | `aria-label="出席回数帯別分布"` | `aria-label="出席回数べつの人数"` | aria / **テスト T-01・T-05** | J-09 |

> `ZONE_HELP` 参照（23 行・実体は §10 で変更）/ `data-testid`（`attendance-zone-distribution` / `-empty`）/ `role="group"` / SVG fill（`var(--ubm-color-*)`・不変）/ `ZONE_LABEL` 参照は不変。

---

## 9. `apps/web/src/features/admin/attendance/components/SessionAttendanceTable.tsx`

| 行 | 対象 | Before | After | 影響 | ID |
| --- | --- | --- | --- | --- | --- |
| 17 | empty 文言 | `セッションデータがありません` | `開催回のデータがありません` | 画面 | S-08 |

> `data-testid`（`attendance-by-session-empty` / `-table` / `attendance-session-row-*`）/ テーブル列見出し（開催日 / タイトル / 出席者数 / 出席率・据置）/ modal 連携は不変。

---

## 10. `apps/web/src/features/admin/attendance/lib/format-attendance.ts`

| 行 | 対象 | Before | After | 影響 | ID |
| --- | --- | --- | --- | --- | --- |
| 12 | `formatDelta` 単位 | `` return `${sign}${Math.abs(diff * 100).toFixed(1)}pt`; `` | `` ...toFixed(1)}ポイント`; `` | 画面（KPI hint）/ **回帰** | J-07 |
| 23-24 | `ZONE_HELP` | `出席回数帯は、各メンバーの累計出席回数を 0 回、1〜9 回、10〜99 回、100 回以上に分類したものです。` | `各メンバーがこれまでに参加した合計回数を、0回／1〜9回／10〜99回／100回以上に分けて表示しています。` | 画面 / **テスト T-06** | J-11 |
| 29 | PERIOD_PRESETS 3m label | `{ id: "3m", label: "3M", monthsBack: 3 }` | `label: "3か月"` | 画面 / **回帰** | R-10 |
| 30 | PERIOD_PRESETS 6m label | `{ id: "6m", label: "6M", monthsBack: 6 }` | `label: "6か月"` | 画面 / **回帰** | R-10 |
| 31 | PERIOD_PRESETS 1y label | `{ id: "1y", label: "1Y", monthsBack: 12 }` | `label: "1年"` | 画面 / **回帰** | R-10 |

> `formatRate`（3-6 行）/ `ZONE_LABEL`（15-21 行）/ `id`・`monthsBack`（27-32 行）/ `presetToPeriod` / `SELECTABLE_ZONES` / 型（`AttendanceZone` import）は不変。`全期間` / `今月` label は据置。

---

## 11. `apps/web/src/styles/globals.css`（U-03・必要時のみ）

| 対象クラス | 調整 | 制約 |
| --- | --- | --- |
| `.attendance-export-link` | `表計算ファイルで書き出す` のはみ出し回避（`white-space` / `flex-wrap` / `gap`） | 色変更なし・`var(--ubm-color-*)` のみ |
| `.attendance-kpi-support` / `.attendance-kpi-hint` | 長文化の行詰まり回避（`gap` / `line-height`） | 同上 |
| `.attendance-absentee-alert li`（U-01） | 行間 / 区切りの軽微調整 | 同上 |

> HEX / `bg-[#xxx]` / `text-[#xxx]` を一切追加しない（AC-5）。トークンは `tokens.css` 実在値のみ。必要なければ globals.css は無変更（diff ゼロ）でよい。

---

## 12. テスト追従ファイル（同一 wave）

| ファイル | 種別 | 変更 |
| --- | --- | --- |
| `__tests__/AttendanceZoneDistributionChart.spec.tsx` | 編集（追従 + 回帰） | T-01：group name / ZONE_HELP 前方一致を新文言へ |
| `__tests__/AttendanceDetailTabs.spec.tsx` | 編集（追従） | T-02（radio `出席が多い順`）/ T-03 / T-04 |
| `__tests__/KpiPanel.spec.tsx` | 編集（回帰追加） | `開催回数` / `一度でも参加した人の割合` を固定 |
| `__tests__/format-attendance.spec.ts` | 編集（回帰追加） | `ポイント` 単位 / `3か月` `6か月` `1年` label を固定 |
| `playwright/tests/admin-attendance-dashboard-ux.spec.ts` | 編集（追従） | T-05 / T-06 |

---

## 13. 変更しないファイル（再確認のみ）

| ファイル | 理由 |
| --- | --- |
| `MemberAttendanceTable.tsx` | 会員 / 出席数 / 出席率 = 既に日本語 |
| `AttendanceTop10Ranking.tsx` | `#1` / `{n} 回` を維持 |
| `AttendanceDrilldownModal.tsx` | 出席詳細 / 出席 / 欠席 / 閉じる 等が既に平易 |
| `apps/web/src/lib/admin/fetch-attendance.ts` | データ取得層（AC-7・endpoint / shape / 型不変） |
| `apps/api/**` / `packages/shared/**` | 変更ゼロ（AC-7） |

# Phase 5 — 実装手順書（runbook）

> 後続実装者がそのまま着手できる粒度。行アンカーは Read 時点（2026-06-11）の実コード。各置換の前に `grep` で対象文字列を再確認すること（drift 防止）。
> 不変条件: API/D1/shared 型を変更しない（AC-7）/ 新規 component・primitive・util・型・CSS クラスゼロ（AC-6）/ HEX 直書きゼロ（AC-5）/ testid・role・data-*・href 不変（AC-8）。
> **本タスクは文字列置換中心。新規ファイルは 1 つも作らない。**

---

## 0. 着手前の前提確認（実コード裏取り）

```bash
# 対象の Before 文字列が存在することを確認
grep -nE "PRIMARY|TREND|DETAIL|ADMIN / DASHBOARD|TOP10|セッション|ユニーク|トレンド|区画|CSVエクスポート|出席回数帯" \
  apps/web/app/\(admin\)/admin/dashboard/attendance/page.tsx \
  apps/web/src/features/admin/attendance/components/*.tsx \
  apps/web/src/features/admin/attendance/lib/format-attendance.ts
# tokens.css の実在 token（U-03 で使う場合）
grep -nE "ubm-color|ubm-space|ubm-radius" apps/web/src/styles/tokens.css | head
```

---

## 1. 編集ファイル一覧テーブル（[Feedback RT-03]）

| # | パス | 種別 | カバー |
| --- | --- | --- | --- |
| 1 | `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` | 編集 | R-01 / J-08 派生 |
| 2 | `.../components/AttendanceAnalyticsPage.tsx` | 編集 | R-02〜R-06 / S-10 / J-02 / J-05 / J-08/J-10 派生 |
| 3 | `.../components/KpiPanel.tsx` | 編集 | S-01〜S-03 / J-03 / J-04 / J-06 / J-12 |
| 4 | `.../components/AttendanceAbsenteeAlert.tsx` | 編集 | S-04 / S-05 / U-01 |
| 5 | `.../components/AttendanceDetailTabs.tsx` | 編集 | R-07 / R-08 / S-06 / S-07 |
| 6 | `.../components/AttendanceFilterBar.tsx` | 編集 | R-09 / J-10 |
| 7 | `.../components/AttendanceTrendChart.tsx` | 編集 | S-09 / J-01 |
| 8 | `.../components/AttendanceZoneDistributionChart.tsx` | 編集 | J-08 / J-09 |
| 9 | `.../components/SessionAttendanceTable.tsx` | 編集 | S-08 |
| 10 | `.../lib/format-attendance.ts` | 編集 | R-10 / J-07 / J-11 |
| 11 | `apps/web/src/styles/globals.css` | 編集（任意） | U-03 |
| 12-16 | `__tests__/*` + `playwright/*` | 編集 | T-01〜T-06 + 回帰 |

> **削除・新規ファイルはなし。**

---

## 2. ファイル別 置換手順（change-map 転記）

> 各置換は「行 / Before / After」。Before は逐語一致で Edit する。

### 2.1 `page.tsx`

| 行 | Before | After |
| --- | --- | --- |
| 29 | `eyebrow="ADMIN / DASHBOARD"` | `eyebrow="管理 / ダッシュボード"` |
| 31 | `description="出席率の推移・区画分布・欠席フォロー対象を確認"` | `description="出席率の移り変わり・出席回数べつの分布・要フォロー対象を確認"` |

### 2.2 `AttendanceAnalyticsPage.tsx`

| 行 | Before | After |
| --- | --- | --- |
| 31 | `期間と出席回数帯で絞り込み、出席率の推移、累計出席回数の分布、要フォロー対象を確認します。` | `期間と累計の出席回数で絞り込み、出席率の移り変わり、出席回数べつの分布、要フォロー対象を確認します。` |
| 37 | `<h2 id="attendance-primary-heading">PRIMARY</h2>` | `<h2 id="attendance-primary-heading">全体の状況</h2>` |
| 46 | `sectionLabel="出席KPI"` | `sectionLabel="出席のおもな指標"` |
| 64 | `<h2 id="attendance-trend-heading">TREND</h2>` | `<h2 id="attendance-trend-heading">出席の移り変わり</h2>` |
| 65 | `月別推移と参加回数帯から、参加の偏りを確認します。` | `月ごとの移り変わりと出席回数のはばから、参加のかたよりを確認します。` |
| 69 | `<h3>出席トレンド</h3>` | `<h3>月ごとの出席の移り変わり</h3>` |
| 70 | `月別の延べ出席数と開催セッション数の変化を確認します。` | `月ごとの延べ出席数と開催回数の変化を確認します。` |
| 82 | `<h3>出席回数帯別分布</h3>` | `<h3>出席回数べつの人数</h3>` |
| 88 | `sectionLabel="区画別分布"` | `sectionLabel="出席回数べつの分布"` |
| 99 | `<h2 id="attendance-detail-heading">DETAIL</h2>` | `<h2 id="attendance-detail-heading">くわしい一覧</h2>` |
| 100（任意 M-4） | `詳細テーブルは必要な観点だけを切り替えて確認します。` | `必要な観点だけを切り替えて、くわしい一覧を確認します。` |

> `id` 属性値（`attendance-*-heading`）と `aria-labelledby` は維持（aria 参照保護）。

### 2.3 `KpiPanel.tsx`

| 行 | Before | After |
| --- | --- | --- |
| 49 | `前期間比 {formatDelta(...)}` | `前の期間とくらべて {formatDelta(...)}` |
| 52 | `ユニーク出席率 {formatRate(...)}` | `一度でも参加した人の割合 {formatRate(...)}` |
| 56 | `aria-label="出席KPI補助指標"` | `aria-label="出席のおもな指標"` |
| 59 | `label="期間内延べ出席数"` | `label="期間内の出席のべ人数"` |
| 61 | `hint="セッション別出席者数の合計"` | `hint="開催回ごとの出席者数を合計した数"` |
| 67 | `hint="1 セッションあたり"` | `hint="1回の開催あたり"` |
| 71 | `label="セッション数"` | `label="開催回数"` |
| 73 | `hint="期間内の開催数"` | `hint="この期間の開催回数"` |

> `data-testid`（`attendance-kpi-rate` / `-attendees` / `-avg` / `-sessions`）と `全体出席率`（据置）は不変。

### 2.4 `AttendanceAbsenteeAlert.tsx`

| 行 | Before | After |
| --- | --- | --- |
| 21 | `直近 {data.lastN} セッション連続欠席のメンバーはいません` | `直近 {data.lastN} 回つづけて欠席している人はいません` |
| 35 | `直近 {data.lastN} セッション連続欠席` | `直近 {data.lastN} 回つづけて欠席` |

> U-01: `data-attendance-follow` / testid / `<li>` span 順序は不変。CSS は §4。

### 2.5 `AttendanceDetailTabs.tsx`

| 行 | Before | After |
| --- | --- | --- |
| 20 | `{ value: "session", label: "セッション別" }` | `{ value: "session", label: "開催回ごと" }` |
| 22 | `{ value: "top10", label: "TOP10" }` | `{ value: "top10", label: "出席が多い順" }` |
| 44 | `sectionLabel="セッション別出席状況"` | `sectionLabel="開催回ごとの出席状況"` |
| 65 | `sectionLabel="出席ランキング TOP 10"` | `sectionLabel="出席が多い人の一覧"` |

> `value` / `useState` / `会員別`（21 行）/ `会員別出席率`（54 行）は不変。

### 2.6 `AttendanceFilterBar.tsx`

| 行 | Before | After |
| --- | --- | --- |
| 42 | `<legend>出席回数帯</legend>` | `<legend>累計の出席回数</legend>` |
| 64 | `CSVエクスポート` | `表計算ファイルで書き出す` |

> `href` / `download` / testid / `期間` legend（27 行）は不変。

### 2.7 `AttendanceTrendChart.tsx`

| 行 | Before | After |
| --- | --- | --- |
| 12 | `トレンドデータがありません` | `推移データがありません` |
| 31 | `aria-label="出席トレンド"` | `aria-label="出席の移り変わり"` |
| 47 | `` `${b.period}: ${b.attendeeCount} 人 / ${b.sessionCount} セッション` `` | `` `${b.period}: ${b.attendeeCount} 人 / 開催 ${b.sessionCount} 回` `` |

> `role="img"` / SVG `aria-label="月別出席者数"`（34 行・据置）/ testid 不変。

### 2.8 `AttendanceZoneDistributionChart.tsx`

| 行 | Before | After |
| --- | --- | --- |
| 12 | `区画別分布データがありません` | `出席回数べつのデータがありません` |
| 20 | `aria-label="出席回数帯別分布"` | `aria-label="出席回数べつの人数"` |

> `role="group"` / testid / SVG fill（`var(--ubm-color-*)`）/ `ZONE_HELP` 参照は不変。

### 2.9 `SessionAttendanceTable.tsx`

| 行 | Before | After |
| --- | --- | --- |
| 17 | `セッションデータがありません` | `開催回のデータがありません` |

> testid / 列見出し / modal 連携不変。

---

## 3. 契約保持箇所の置換例（`lib/format-attendance.ts`）

### 3.1 `formatDelta`（J-07・単位のみ）

```ts
// 8-13 行。pt → ポイント のみ。符号・小数桁・null 処理は不変。
export const formatDelta = (current: number, previous: number | null): string => {
  if (previous === null || !Number.isFinite(previous)) return "—";
  const diff = current - previous;
  const sign = diff > 0 ? "↑" : diff < 0 ? "↓" : "→";
  return `${sign}${Math.abs(diff * 100).toFixed(1)}ポイント`; // ← pt を ポイント に
};
```

### 3.2 `ZONE_HELP`（J-11・定数文字列のみ）

```ts
// 23-24 行
export const ZONE_HELP =
  "各メンバーがこれまでに参加した合計回数を、0回／1〜9回／10〜99回／100回以上に分けて表示しています。";
```

### 3.3 `PERIOD_PRESETS`（R-10・label のみ・id/monthsBack 不変）

```ts
// 26-32 行
export const PERIOD_PRESETS = [
  { id: "all", label: "全期間", monthsBack: null as number | null },
  { id: "1m", label: "今月", monthsBack: 1 },
  { id: "3m", label: "3か月", monthsBack: 3 },   // 3M → 3か月
  { id: "6m", label: "6か月", monthsBack: 6 },   // 6M → 6か月
  { id: "1y", label: "1年", monthsBack: 12 },    // 1Y → 1年
] as const;
```

> `id` / `monthsBack` を変えないことで `presetToPeriod` / URL クエリ / フィルタ挙動が完全不変（AC-10）。

---

## 4. U-03 軽微 CSS（必要時のみ・`globals.css`）

> 文言が長くなる箇所（`表計算ファイルで書き出す` 等）ではみ出し / 折返しが発生する場合のみ調整。**HEX / `bg-[#xxx]` / `text-[#xxx]` を一切追加しない。色は `var(--ubm-color-*)` のみ。**

```css
/* 例（必要時のみ）: export link のはみ出し回避。色は変えない */
.attendance-export-link {
  white-space: nowrap;            /* または折返し許容なら削除 */
  gap: var(--ubm-space-1, 0.25rem);
}
/* U-01: メールのみ行の可読性 */
.attendance-absentee-alert li {
  gap: var(--ubm-space-2, 0.5rem);
}
```

> 不要なら globals.css は無変更（diff ゼロ）でよい。jsdom は CSS を評価しないため見た目確認は Phase 11。

---

## 5. テスト追従 + 回帰追加（同一 wave）

### 5.1 追従（T-01〜T-06）

- `AttendanceZoneDistributionChart.spec.tsx`（20-21 行）: `name: "出席回数帯別分布"`→`"出席回数べつの人数"`、`/各メンバーの累計出席回数/`→`/各メンバーがこれまでに参加した合計回数/`。
- `AttendanceDetailTabs.spec.tsx`（42/59/76 行）: `name: "TOP10"`→`"出席が多い順"`。54 行 `/セッション別出席状況.*/`→`/開催回ごとの出席状況.*/`。77 行 `/出席ランキング TOP 10.*/`→`/出席が多い人の一覧.*/`。
- `playwright/.../admin-attendance-dashboard-ux.spec.ts`（33-34 行）: `'出席回数帯別分布'`→`'出席回数べつの人数'`、`'出席回数帯は、各メンバーの累計出席回数'`→`'各メンバーがこれまでに参加した合計回数'`。

### 5.2 回帰追加（TC-RXX・test-plan §1〜§5）

- `format-attendance.spec.ts`: `PERIOD_PRESETS` ラベル（`3か月`/`6か月`/`1年`）+ `monthsBack` 不変 + `formatDelta(0.42,0.35)==="↑7.0ポイント"` + `ZONE_HELP` 前方一致。
- `KpiPanel.spec.tsx`: `開催回数` / `一度でも参加した人の割合` / `前の期間とくらべて` / aria-label `出席のおもな指標`。
- `AttendanceDetailTabs.spec.tsx`: radio `開催回ごと` 取得 + 排他維持。
- `AttendanceAbsenteeAlert.spec.tsx`: `/回つづけて欠席/` + empty `/回つづけて欠席している人はいません/`。

---

## 6. 挙動不変温存の確認手順（AC-10）

| 機能 | 確認 |
| --- | --- |
| 期間フィルタ | `PERIOD_PRESETS` の `id` / `monthsBack` 不変 → `presetToPeriod` で URL クエリが同一。プリセットボタンの `data-active` / `aria-pressed` 不変 |
| 出席回数フィルタ | `SELECTABLE_ZONES` / `toggleZone` 不変。legend 文言のみ変更 |
| 書き出し | `attendance-export-link` の `href`（`buildAttendanceExportUrlClient`）/ `download` 不変。文言のみ変更。**実ファイルは引き続き CSV** |
| ドリルダウン modal | `SessionAttendanceTable` の `setOpenSession` / `AttendanceDrilldownModal` 不変 |
| DetailTabs 排他 | `value` / `useState` / 排他描画不変。label のみ変更 |
| SafeResult degrade | `AdminSectionErrorClient` の分岐不変。sectionLabel 文言のみ変更 |

---

## 7. ローカル検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/features/admin/attendance/__tests__
mise exec -- pnpm verify:tokens                       # HEX 0（AC-5）
git diff --name-only -- apps/api packages/shared       # 空（AC-7）
# 英語 / 専門語残存 0（実 UI 文字列。テスト内の .not.toContain / 説明は除外して目視）
grep -rnE "PRIMARY|TREND|DETAIL|TOP ?10|ADMIN / DASHBOARD|3M|6M|1Y|CSVエクスポート|セッション|ユニーク|トレンド|区画|出席回数帯" \
  apps/web/src/features/admin/attendance/components apps/web/src/features/admin/attendance/lib \
  apps/web/app/\(admin\)/admin/dashboard/attendance
```

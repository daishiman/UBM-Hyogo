# Phase 4 — テストケース一覧（追従 T-NN + 回帰 TC-XX）

> 上流: `./main.md` / `outputs/phase-02/change-map.md`。各ケースは対象 / 操作 / 期待値 / 配置 spec を持つ。
> After 文言は change-map を逐語の正とする。新規 spec ファイルは作らず既存 spec へ追記する。

---

## 0. 既存テスト追従（T-01〜T-06・同一 wave 必須）

| ID | spec ファイル（行） | 旧アサート | 新アサート | リネーム |
| --- | --- | --- | --- | --- |
| **T-01** | `AttendanceZoneDistributionChart.spec.tsx`（20-21） | `getByRole("group", { name: "出席回数帯別分布" })` / `getByText(/各メンバーの累計出席回数/)` | `getByRole("group", { name: "出席回数べつの人数" })` / `getByText(/各メンバーがこれまでに参加した合計回数/)` | J-09 / J-11 |
| **T-02** | `AttendanceDetailTabs.spec.tsx`（42 / 59 / 76） | `getByRole("radio", { name: "TOP10" })` | `getByRole("radio", { name: "出席が多い順" })` | R-07 |
| **T-03** | 〃（54） | `getByText(/セッション別出席状況.*読み込みに失敗しました/)` | `getByText(/開催回ごとの出席状況.*読み込みに失敗しました/)` | S-07 |
| **T-04** | 〃（77） | `getByText(/出席ランキング TOP 10.*読み込みに失敗しました/)` | `getByText(/出席が多い人の一覧.*読み込みに失敗しました/)` | R-08 |
| **T-05** | `playwright/.../admin-attendance-dashboard-ux.spec.ts`（33） | `getByText('出席回数帯別分布')` | `getByText('出席回数べつの人数')` | J-09 |
| **T-06** | 〃（34） | `getByText('出席回数帯は、各メンバーの累計出席回数')` | `getByText('各メンバーがこれまでに参加した合計回数')` | J-11 |

> `会員別`（DetailTabs radio・据置）と `会員別出席率`（member sectionLabel・74 行・据置）は変更しない。

---

## 1. 回帰: `format-attendance.ts`（spec: `__tests__/format-attendance.spec.ts` 既存編集 / AC-1 / AC-3）

| TC | 対象 | 操作 | 期待値 |
| --- | --- | --- | --- |
| **TC-R01** | `PERIOD_PRESETS` ラベル | `PERIOD_PRESETS.find(p => p.id === "3m")?.label` | `"3か月"`。同様に `"6m"`→`"6か月"`、`"1y"`→`"1年"` |
| **TC-R01b** | PRESETS 不変（挙動保護） | `PERIOD_PRESETS.find(p => p.id === "3m")?.monthsBack` | `3`（`monthsBack` / `id` 不変 = フィルタ挙動保護） |
| **TC-R06** | `formatDelta` 単位 | `formatDelta(0.42, 0.35)` | `"↑7.0ポイント"`（`pt` を含まない・記号 `↑` 維持） |
| **TC-R06b** | `formatDelta` null | `formatDelta(0.42, null)` | `"—"`（不変） |
| **TC-R06c** | `formatDelta` 同値 | `formatDelta(0.4, 0.4)` | `"→0.0ポイント"` |
| **TC-R07** | `ZONE_HELP` 新文言 | `ZONE_HELP` | `各メンバーがこれまでに参加した合計回数` を前方に含む。`出席回数帯` を含まない |

---

## 2. 回帰: `KpiPanel.tsx`（spec: `__tests__/KpiPanel.spec.tsx` 既存編集 / AC-2 / AC-3）

> fixture: `overview = { totalSessions: 10, totalMembers: 50, overallRate: 0.42, uniqueAttendeeCount: 30, uniqueAttendanceRate: 0.6, previousPeriodRate: 0.35, filter: {...} }`, `attendeeCount = 120`。実フィールドは Phase 5 着手時に `packages/shared` で再確認。

| TC | 対象 | 操作 | 期待値 |
| --- | --- | --- | --- |
| **TC-R02** | 開催回数 label | `render(<KpiPanel overview={overview} attendeeCount={120} />)` | `getByTestId("attendance-kpi-sessions")` の textContent に `"開催回数"` を含み `"セッション"` を含まない |
| **TC-R03** | 一度でも参加した人の割合 | 同上 | `getByTestId("attendance-kpi-rate")` 配下に `"一度でも参加した人の割合"` を含み `"ユニーク"` を含まない |
| **TC-R04** | 前の期間とくらべて | 同上 | rate hint に `"前の期間とくらべて"` を含み `"前期間比"` を含まない |
| **TC-R04b** | 延べ出席数 hint | 同上 | `getByTestId("attendance-kpi-attendees")` 配下に `"開催回ごとの出席者数を合計した数"` を含む |
| **TC-D-KPI** | aria-label 不変（role 維持） | 同上 | secondary-grid が `aria-label="出席のおもな指標"`（旧 `出席KPI補助指標`）。testid `attendance-kpi-panel` 維持 |

---

## 3. 回帰 + 追従: `AttendanceDetailTabs.tsx`（spec: `__tests__/AttendanceDetailTabs.spec.tsx` 既存編集 / AC-1 / AC-2）

| TC | 対象 | 操作 | 期待値 |
| --- | --- | --- | --- |
| **TC-R05** | 開催回ごと radio | `render(<AttendanceDetailTabs bySession={safeOk(sessions)} ranking={safeOk(members)} />)` | `getByRole("radio", { name: "開催回ごと" })` が存在（旧 `セッション別`）。初期タブで `attendance-by-session-table` 表示 |
| **TC-R05b** | 出席が多い順 radio（T-02 と同義） | `fireEvent.click(getByRole("radio", { name: "出席が多い順" }))` | `attendance-top10` が表示（value `top10` 不変・排他維持） |
| **TC-D02** | タブ排他 / value 不変（AC-10） | 上記クリック後 | `attendance-by-session-table` は `null`。`会員別` radio は label 据置で取得可能 |

---

## 4. 追従: `AttendanceZoneDistributionChart.tsx`（T-01 + 回帰 / AC-3）

| TC | 対象 | 操作 | 期待値 |
| --- | --- | --- | --- |
| **TC-R08** | group aria-label | `render(<AttendanceZoneDistributionChart data={rows} />)` | `getByRole("group", { name: "出席回数べつの人数" })`（T-01 と同義・role `group` 維持） |
| **TC-R08b** | empty 文言 | `data.rows = []` | `getByTestId("attendance-zone-empty")` に `"出席回数べつのデータがありません"`（`区画` を含まない） |

---

## 5. DOM contract 不変（横断 / AC-8 / AC-10）

| TC | 対象 | 期待値 |
| --- | --- | --- |
| **TC-D01** | testid / role / href 維持 | 全 attendance spec の既存 `getByTestId` / `getByRole` が After 実装で pass。`attendance-export-link` の `href` 値は不変 |

> AbsenteeAlert の `回つづけて欠席`（S-04/S-05）は `AttendanceAbsenteeAlert.spec.tsx`（既存）に回帰 it を追加する（`getByText(/回つづけて欠席/)` / empty `/回つづけて欠席している人はいません/`・`セッション` を含まない）。

---

## 6. 配置 spec ファイル一覧（Phase 5 runbook 入力）

| spec ファイル | 種別 | カバー |
| --- | --- | --- |
| `__tests__/format-attendance.spec.ts` | 既存編集（回帰追加） | TC-R01/R01b/R06/R06b/R06c/R07 |
| `__tests__/KpiPanel.spec.tsx` | 既存編集（回帰追加） | TC-R02/R03/R04/R04b/D-KPI |
| `__tests__/AttendanceDetailTabs.spec.tsx` | 既存編集（追従 + 回帰） | T-02/T-03/T-04 + TC-R05/R05b/D02 |
| `__tests__/AttendanceZoneDistributionChart.spec.tsx` | 既存編集（追従 + 回帰） | T-01 + TC-R08/R08b |
| `__tests__/AttendanceAbsenteeAlert.spec.tsx` | 既存編集（回帰追加） | S-04/S-05 回帰 |
| `playwright/tests/admin-attendance-dashboard-ux.spec.ts` | 既存編集（追従） | T-05/T-06 |

## 7. 状態の確認

- T-01〜T-06 は After 実装前は **fail**（Before 文字列を探すため）。Phase 5 実装と同一 wave で新文言へ更新し Green 化。
- 回帰 TC-RXX は After 実装後に Green。実装前は fail（新文言が未反映）。
- DOM 不変 TC-D01/D02 は実装前後で pass（testid / role / href を変えないため）。

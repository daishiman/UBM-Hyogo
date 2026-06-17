# Phase 6 — テスト拡充ケース一覧（TC-E-XX）

> 上流: `./main.md`。残存ゼロ grep ガード / degrade 新文言 / スイート衛生。
> 文字列の正本は `outputs/phase-02/change-map.md`。

---

## 1. 残存ゼロ grep ガード（AC-1 / AC-2 / AC-3）

> 対象は `apps/web/src/features/admin/attendance/components` + `.../lib` + route のみ。`__tests__/`（負アサート `.not.toContain` を含む）は除外する。
> 実 UI が 0 件であることを保証する（CI 補助 / Phase 9 ローカルで実行）。

| TC | 観点 | コマンド（期待 = 0 件） | AC |
| --- | --- | --- | --- |
| **TC-E-01** | 英語見出し / プリセット | `grep -rnE "PRIMARY\|TREND\|DETAIL\|TOP ?10\|ADMIN / DASHBOARD" <component+lib+route>` | AC-1 |
| **TC-E-02** | 英語プリセット / CSV | `grep -rnE "\b3M\b\|\b6M\b\|\b1Y\b\|CSVエクスポート" <同>` | AC-1 |
| **TC-E-03** | セッション | `grep -rn "セッション" <同>` | AC-2 |
| **TC-E-04** | ユニーク / トレンド / 区画 | `grep -rnE "ユニーク\|トレンド\|区画" <同>` | AC-3 |
| **TC-E-05** | 出席回数帯 / pt 単位 | `grep -rnE "出席回数帯\|[0-9]pt\b" <同>` | AC-3 |

> 注: `pt` は CSS の `padding`/`pt` 単位など別文脈で誤検知し得るため `[0-9]pt\b`（数字直後）に限定。`format-attendance.ts` の `formatDelta` 戻り値が `ポイント` になっていれば 0 件。

---

## 2. degrade（fail path）新 sectionLabel 確認（AC-10）

> degrade は `AdminSectionErrorClient` が `読み込みに失敗しました` 付き message を表示する既存挙動。sectionLabel の文言だけが新表記になることを確認する。挙動（degrade すること自体）は不変。

| TC | 対象 | 操作 | 期待値 | 配置 spec |
| --- | --- | --- | --- | --- |
| **TC-E-06** | overview error → KPI degrade | `AttendanceAnalyticsPage` の overview を error 化（または KPI degrade 経路を render） | degrade 文言に `出席のおもな指標` を含む（旧 `出席KPI`） | （server component のため）grep ガード + 実装確認。component 単位は KpiPanel 側で代替不可のため AnalyticsPage の sectionLabel 文字列を grep で確認 |
| **TC-E-07** | by-session error → degrade | `render(<AttendanceDetailTabs bySession={safeErr({...})} ranking={safeOk(members)} />)` | `getByText(/開催回ごとの出席状況.*読み込みに失敗しました/)`（T-03 と同義） | `AttendanceDetailTabs.spec.tsx` |
| **TC-E-08** | top10 error → degrade | 上記 + `fireEvent.click(getByRole("radio", { name: "出席が多い順" }))` | `getByText(/出席が多い人の一覧.*読み込みに失敗しました/)`（T-04 と同義） | `AttendanceDetailTabs.spec.tsx` |
| **TC-E-09** | zone error sectionLabel | `AttendanceAnalyticsPage` の zone を error 化（または sectionLabel 文字列を grep） | `出席回数べつの分布`（旧 `区画別分布`） | grep ガード（AnalyticsPage は async server component） |

> `AttendanceAnalyticsPage` は `async` server component（`await fetchAttendanceAnalyticsBundle`）のため component spec で直接 render しにくい。TC-E-06/E-09 の sectionLabel は (1) 実装の文字列を grep で確認、(2) 視覚は Phase 11 staging で error シナリオを目視、で担保する。component 単位で render 可能な degrade（DetailTabs）は TC-E-07/E-08 で vitest 検証する。

---

## 3. テストスイート衛生（[FB-TASK-01/02]）

| TC | 観点 | コマンド（期待 = 0 件） |
| --- | --- | --- |
| **TC-E-10** | skip / only 残存 | `grep -rnE "describe\.skip\|it\.skip\|\.only\(" apps/web/src/features/admin/attendance/__tests__` |

> Before 文字列に依存した旧アサートが `describe.skip` で温存されると CI を素通りして回帰検知が無効化される。0 件を保証する。

---

## 4. AbsenteeAlert「回つづけて欠席」回帰（AC-2 補強）

| TC | 対象 | 操作 | 期待値 | 配置 spec |
| --- | --- | --- | --- | --- |
| **TC-E-11** | summary 新文言 | `render(<AttendanceAbsenteeAlert data={absenteesWarn} />)` | `getByText(/回つづけて欠席/)` を含む。`セッション` を含まない | `AttendanceAbsenteeAlert.spec.tsx` |
| **TC-E-12** | empty 新文言 | `data.rows = []` | `getByText(/回つづけて欠席している人はいません/)`。`data-attendance-follow` 不変 | `AttendanceAbsenteeAlert.spec.tsx` |

---

## 5. 状態の確認

- TC-E-01〜E-05（残存 grep）: Phase 5 実装後に 0 件（pass）。実装前は Before 文字列があるため非 0（fail）。
- TC-E-07/E-08/E-11/E-12: Phase 5 実装後に Green。
- TC-E-10（skip 残存）: 実装後も 0 件であることを維持（追従時に旧アサートを skip で残さない）。
- TC-E-06/E-09: server component のため grep + Phase 11 視覚で担保（vitest 直接検証は不可）。

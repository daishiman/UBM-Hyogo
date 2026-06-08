# Phase 6 — 異常系・境界値テストケース（TC-E-XX）

> 上流: `./main.md`。fixture は `phase-04/test-plan.md` §0（`overview` / `absenteesWarn` / `absenteesNone` / `okSession` / `okRanking` / `errResult`）を流用。
> 配置: Phase 4 の新規 3 spec に `describe("fail path", ...)` ブロックを追記する（新規ファイルは作らない）。

## 1. degrade（SafeResult error）

| TC-E | 対象 spec | 操作 | 期待値 | AC |
| --- | --- | --- | --- | --- |
| **TC-E-01** | `AttendanceDetailTabs.spec.tsx` | `render(<AttendanceDetailTabs bySession={errResult} ranking={errResult} />)` | 初期 "session" タブで `AdminSectionErrorClient` 相当（error message "失敗"）が描画され、`attendance-by-session-table` は `null`。crash しない | AC-10 |
| **TC-E-03** | `AttendanceDetailTabs.spec.tsx` | 全 error（`bySession=errResult` / `ranking=errResult`）で 3 タブを順に `fireEvent.click` | 各タブで error degrade が表示され、どのタブでも throw / 白画面にならない（`expect(() => fireEvent.click(...)).not.toThrow()`） | AC-10 |

> overview / trend / zoneDistribution の degrade（PRIMARY/TREND ゾーン）は `AttendanceAnalyticsPage`（async server component）側の `SafeResult.ok` 分岐で実現。component spec で直接 render できないため、degrade 分岐は (1) `KpiPanel` 非描画時に `AdminSectionErrorClient` を出す親ロジックを Phase 11 playwright で、または (2) PRIMARY ゾーンを束ねる検証可能な単位に切り出してテストする。本 TC-E では DETAIL タブ（client component）の degrade を component spec で担保し、PRIMARY/TREND degrade は playwright visual smoke（error 状態 fixture）で補完する位置づけとする。

### TC-E-01b（PRIMARY degrade の補足・playwright 委譲）

| TC-E | 対象 | 操作 | 期待値 | AC |
| --- | --- | --- | --- | --- |
| **TC-E-01b** | playwright visual smoke（Phase 11） | overview error 状態の `/admin/dashboard/attendance` を描画 | PRIMARY ゾーンに「出席KPI」degrade（`AdminSectionErrorClient`）が表示され、要フォロー hero / TREND / DETAIL は描画継続 | AC-10 |

## 2. EmptyState / 境界値トーン（`data-attendance-follow`）

| TC-E | 対象 spec | 操作 | 期待値 | AC |
| --- | --- | --- | --- | --- |
| **TC-E-02** | `AttendancePrimaryHero.spec.tsx` | `render(<AttendanceAbsenteeAlert data={absenteesNone} />)` | `data-attendance-follow="none"`。`attendance-absentee-empty` testid が存在し「いません」を含む。`.ui-badge-success` 相当（tone=success）。`attendance-absentee-alert`（details）は非生成 | AC-10 / AC-4 |
| **TC-E-06** | `AttendancePrimaryHero.spec.tsx` | 欠席者 0 件（`rows: []`） | `data-attendance-follow="none"`、Badge「0 名」、tone=success | AC-4 |
| **TC-E-07** | `AttendancePrimaryHero.spec.tsx` | 欠席者 1 件（`rows: [1 件]`） | `data-attendance-follow="warn"`、Badge「1 名」、tone=warning、`details` 展開 | AC-4 |
| **TC-E-08** | `AttendancePrimaryHero.spec.tsx` | 欠席者 多数（`rows: [3 件]` = `absenteesWarn`） | `data-attendance-follow="warn"`、Badge「2 名」（fixture は 2 件）/ 多数版を別途用意し件数表示が一致、`ul > li` が件数分描画（`slice(0,50)` 上限） | AC-4 |

> TC-E-06/07/08 は `attendanceFollowLevel` の境界（0→none / 1→warn / 多数→warn）が UI（属性 + Badge tone）に正しく反映されることを確認する。純粋関数単体は TC-01〜03b（Phase 4）でカバー済のため、ここでは「関数結果が DOM 属性に伝播する」結線を検証する。

## 3. Segmented 初期タブ（AC-3）

| TC-E | 対象 spec | 操作 | 期待値 | AC |
| --- | --- | --- | --- | --- |
| **TC-E-04** | `AttendanceDetailTabs.spec.tsx` | `render(<AttendanceDetailTabs bySession={okSession} ranking={okRanking} />)`（initialTab 省略） | 初期タブ = "session"。`attendance-by-session-table` 存在、`attendance-ranking-table` / `attendance-top10` は `null`。`aria-checked="true"` が「セッション別」radio に付く | AC-3 |
| **TC-E-05** | `AttendanceDetailTabs.spec.tsx` | `render(<AttendanceDetailTabs ... initialTab="member" />)` | 初期タブ = "member"。`attendance-ranking-table` 存在、`attendance-by-session-table` は `null` | AC-3 |

## 4. フィルタ変更後の再 fetch 挙動不変（AC-10）

| TC-E | 対象 | 操作 | 期待値 | AC |
| --- | --- | --- | --- | --- |
| **TC-E-09** | `AttendanceFilterBar`（既存・非改修）/ または playwright | 期間プリセット切替 / 回数帯チェック変更 | searchParams が更新され、`AttendanceAnalyticsPage`（server component）が再評価され bundle 再 fetch。フィルタ UI の挙動が Phase 5 前後で不変 | AC-10 |

> `AttendanceFilterBar.tsx` は本タスクで非改修（AC-10）。TC-E-09 は「フィルタ機構が壊れていない」ことの回帰確認であり、既存挙動の維持を `git diff --stat`（diff 空）+ 手動 / playwright で担保する。component spec での新規テストは不要（既存挙動の温存確認）。

## 5. 境界値網羅マトリクス

| 軸 | 値 | カバー TC-E |
| --- | --- | --- |
| 欠席者数 | 0 | TC-E-02, TC-E-06 |
| 欠席者数 | 1 | TC-E-07 |
| 欠席者数 | 多数 | TC-E-08 |
| SafeResult | 全 ok | TC-04（Phase 4） |
| SafeResult | 部分 error（ranking のみ） | TC-09, TC-10（Phase 4） |
| SafeResult | 全 error | TC-E-01, TC-E-03 |
| Segmented 初期タブ | 既定 "session" | TC-E-04 |
| Segmented 初期タブ | 明示 "member" | TC-E-05 |

## 6. 回帰 guard（再掲・位置づけ）

| guard | 検証 | 失敗時 |
| --- | --- | --- |
| `verify-design-tokens`（CI gate） | attendance + globals.css に HEX 0（AC-5） | HEX 1 件で fail。runbook の token-only CSS で pass |
| playwright visual smoke（Phase 11） | 3 層レイアウト視覚回帰 / error 状態 degrade（TC-E-01b） | baseline 差分検出。3 層化は意図的更新として承認後 baseline 更新 |
| vitest 対象限定（Phase 9） | TC-01〜20 + TC-E-01〜09 全 Green | fail path 含む全ケース pass |

## 7. 実装メモ

- 全 TC-E は既存書式（happy-dom + testing-library + `afterEach(cleanup)` + `fireEvent`）を踏襲し、`vi.stubGlobal` を使わない（[FB-VSCPKR-02]）。
- 多数件 fixture は `absenteesWarn`（2 件）に加え、`slice(0,50)` 上限確認用に 51 件超のケースを TC-E-08 で任意追加してもよい（上限 50 表示の確認）。

# Phase 4 — テストケース一覧（TC-XX）

> 上流: `./main.md`。各 TC は対象 / 操作 / 期待値 / 追加 spec ファイルパスを持つ。型・testid は実コード裏取り済（`_shared-context.md` §10 確定表）。
> Red 設計: Phase 5 実装前は全 TC fail が正常。fail path（TC-E-XX）は Phase 6（`outputs/phase-06/failure-cases.md`）で追加する。

## 0. fixture（テスト共通データ）

```ts
import type {
  AttendanceOverviewExt,
  AttendanceAbsenteeList,
  SessionAttendanceRowView,
  MemberAttendanceRankingView,
} from "@ubm-hyogo/shared";
import type { SafeResult } from "@/lib/result"; // 既存 SafeResult 型（ok/error）

const overview: AttendanceOverviewExt = {
  totalSessions: 10,
  totalMembers: 50,
  overallRate: 0.42,
  uniqueAttendeeCount: 30,
  uniqueAttendanceRate: 0.6,
  previousPeriodRate: 0.35,
  filter: { periodFrom: null, periodTo: null, zoneFilter: null },
};

const absenteesWarn: AttendanceAbsenteeList = {
  rows: [
    { memberId: "M1", displayName: "山田太郎", zone: "zone_1_9", lastAttendedAt: "2026-03-01", missedCount: 3 },
    { memberId: "M2", displayName: "鈴木花子", zone: "zone_0", lastAttendedAt: null, missedCount: 3 },
  ],
  lastN: 3,
  filter: { periodFrom: null, periodTo: null, zoneFilter: null },
};

const absenteesNone: AttendanceAbsenteeList = {
  rows: [],
  lastN: 3,
  filter: { periodFrom: null, periodTo: null, zoneFilter: null },
};

const sessionRows: SessionAttendanceRowView[] = [
  { sessionId: "S1", heldOn: "2026-03-01", title: "3月例会", attendeeCount: 12, rate: 0.6 },
];

const rankingRows: MemberAttendanceRankingView[] = [
  { memberId: "M1", displayName: "山田太郎", attendedCount: 8, rate: 0.8 },
];

const okSession: SafeResult<SessionAttendanceRowView[]> = { ok: true, data: sessionRows };
const okRanking: SafeResult<MemberAttendanceRankingView[]> = { ok: true, data: rankingRows };
const errResult = { ok: false, error: { code: "UPSTREAM_ERROR", message: "失敗" } } as const;
```

> 注: `SessionAttendanceRowView` / `MemberAttendanceRankingView` の実フィールドは `packages/shared/src/zod/viewmodel.ts` を Phase 5 着手時に再確認すること（本 fixture は既存 spec / コンポーネント実装から逆算した shape）。

---

## 1. `attendanceFollowLevel` 純粋関数（spec: `__tests__/attendanceFollowLevel.spec.ts` 新規 / AC-4 / [WEEKGRD-02]）

| TC | 対象 | 操作（入力） | 期待値 |
| --- | --- | --- | --- |
| **TC-01** | `attendanceFollowLevel` | `attendanceFollowLevel(0)` | `"none"` を返す |
| **TC-02** | `attendanceFollowLevel` | `attendanceFollowLevel(1)` | `"warn"` を返す |
| **TC-03** | `attendanceFollowLevel` | `attendanceFollowLevel(5)` | `"warn"` を返す |
| **TC-03b** | `attendanceFollowLevel` | `attendanceFollowLevel(-1)`（防御的境界） | throw せず `"none"` を返す（count <= 0 → none） |

> 純粋関数のため `render` 不要。`import { attendanceFollowLevel } from "../lib/attendance-follow-level";` で直接呼ぶ。例外を投げないことを `expect(() => attendanceFollowLevel(-1)).not.toThrow()` でも担保。

---

## 2. `AttendanceDetailTabs` Segmented 排他タブ（spec: `__tests__/AttendanceDetailTabs.spec.tsx` 新規 / AC-3 / AC-9 / AC-10）

| TC | 対象 | 操作 | 期待値 |
| --- | --- | --- | --- |
| **TC-04** | 初期描画 | `render(<AttendanceDetailTabs bySession={okSession} ranking={okRanking} />)` | 初期タブ = "session"。`screen.getByTestId("attendance-by-session-table")` が存在。`screen.queryByTestId("attendance-ranking-table")` は `null`（排他） |
| **TC-05** | タブ切替 → 会員別 | `fireEvent.click(screen.getByRole("radio", { name: "会員別" }))` | `attendance-ranking-table` が存在。`attendance-by-session-table` は `null` に消える |
| **TC-06** | タブ切替 → TOP10 | `fireEvent.click(screen.getByRole("radio", { name: "TOP10" }))` | `attendance-top10` が存在。他 2 表の testid は `null` |
| **TC-07** | a11y radiogroup | 初期描画後 | `screen.getByRole("radiogroup")` が存在し、`screen.getAllByRole("radio").length === 3`。各 radio に `aria-label`（セッション別 / 会員別 / TOP10） |
| **TC-08** | bySession degrade | `render(<AttendanceDetailTabs bySession={errResult} ranking={okRanking} />)` | 初期 "session" タブで `AdminSectionErrorClient` 相当（error message "失敗" を含む要素）が描画され、テーブルは出ない |
| **TC-09** | ranking degrade（member タブ） | `bySession={okSession} ranking={errResult}` で会員別タブへ `fireEvent.click` | member タブが error degrade。session タブ（初期）は正常描画していたこと（切替前）を別 it で確認 |
| **TC-10** | 部分 degrade の独立性 | `bySession={okSession} ranking={errResult}` | session タブは正常描画、member/top10 タブのみ degrade（ranking 共通 source のため両タブ degrade） |

> TC-09/10 の degrade 表現は `AdminSectionErrorClient` を各タブ body で分岐（component-map §2.degrade）。error 文言 "失敗" の存在で assert する。

---

## 3. PRIMARY hero（spec: `__tests__/AttendancePrimaryHero.spec.tsx` 新規 + `KpiPanel.spec.tsx` 追従 / AC-1 / AC-4）

| TC | 対象 | 操作 | 期待値 |
| --- | --- | --- | --- |
| **TC-11** | KpiPanel hero 出席率 | `render(<KpiPanel overview={overview} attendeeCount={120} />)` | `attendance-kpi-rate` の textContent に `"42.0%"` を含む。hero マーカー（`data-testid="attendance-hero-rate"` または `attendance-kpi-rate` に hero クラス `.attendance-hero-rate`）が存在 |
| **TC-12** | KpiPanel ユニーク率 + delta | 同上 | `attendance-kpi-unique` に `"30"` と `"60.0%"`、rate hint/delta に前期比 `formatDelta`（`↑7.0pt`）を含む |
| **TC-13** | 要フォロー hero（warn） | `render(<AttendanceAbsenteeAlert data={absenteesWarn} />)` | ルート要素に `data-attendance-follow="warn"` 属性。件数 `2 名` を含む。`Badge` tone=warning 相当（`.ui-badge-warning` クラス） |
| **TC-14** | 要フォロー hero（none） | `render(<AttendanceAbsenteeAlert data={absenteesNone} />)` | ルート要素に `data-attendance-follow="none"` 属性。`success` トーン（`.ui-badge-success`）。「いません」文言 |
| **TC-11b**（追従） | KpiPanel 既存ケース不変 | 既存 TC（delta null → "—"、0 セッション 0除算回避） | 既存 assert が**そのまま pass**（testid 維持） |

> TC-13/14 の `data-attendance-follow` は `AttendanceAbsenteeAlert` のルート要素に付与。値は `attendanceFollowLevel(data.rows.length)` の結果。`AttendancePrimaryHero.spec.tsx` に TC-13/14 を、`KpiPanel.spec.tsx` に TC-11/12/11b を配置する。

---

## 4. レスポンシブ grid クラス DOM 存在（spec: `AttendanceDetailTabs.spec.tsx` または hero spec に同梱 / AC-8）

| TC | 対象 | 操作 | 期待値 |
| --- | --- | --- | --- |
| **TC-15** | PRIMARY grid クラス | PRIMARY ゾーンをレンダリングする最小ラッパ（または `AttendanceAnalyticsPage` の DOM を component 単位で確認できない場合は hero ラッパ component） | `.attendance-primary-grid` 要素が存在し、grid utility（`grid-cols-1 lg:grid-cols-2` 相当）を className に持つ |
| **TC-16** | DETAIL タブクラス | `AttendanceDetailTabs` 描画 | ルートに `.attendance-detail-tabs` クラスが存在 |

> 注: `AttendanceAnalyticsPage` は `async` server component（`await fetchAttendanceAnalyticsBundle`）のため component spec で直接 render しにくい。grid クラス検証は (1) hero/タブ component のラッパ className を assert する方式に寄せる、または (2) Phase 6 で `AttendanceAnalyticsPage` の構造はレスポンシブ playwright visual smoke に委譲する。TC-15 は実装時に「PRIMARY ゾーンを構成する component（KpiPanel + AbsenteeAlert を束ねるラッパ）」が className を持つ形にして検証する。

---

## 5. 見出し階層 a11y（spec: hero spec / AC-2 / AC-9）

| TC | 対象 | 操作 | 期待値 |
| --- | --- | --- | --- |
| **TC-17** | ゾーン見出しレベル | PRIMARY/TREND/DETAIL ゾーン見出しの描画（実装後 `AttendanceAnalyticsPage` は playwright で、component 単位では各ゾーンラッパの `<h2>` を確認） | ゾーン見出しが `<h2>`（「概況」「傾向」「詳細」）、ゾーン内サブが `<h3>`。`screen.getByRole("heading", { level: 2 })` で取得可能 |

> `AttendanceAnalyticsPage` 全体の h1>h2>h3 階層は Phase 6 で playwright visual smoke + a11y チェックに委譲。component spec では各ゾーンラッパの heading level を assert する。

---

## 6. 既存 spec 追従（不変確認）

| TC | spec | 期待値 |
| --- | --- | --- |
| **TC-18** | `AttendanceTrendChart.spec.tsx` | 変更なしで pass（testid `attendance-trend-chart` / `attendance-trend-empty` 維持） |
| **TC-19** | `AttendanceZoneDistributionChart.spec.tsx` | 変更なしで pass |
| **TC-20** | `format-attendance.spec.ts` / `buildExportUrl.spec.ts` | 変更なしで pass（lib 不変） |

---

## 7. 追加 spec ファイルパス一覧（Phase 5 runbook 入力）

| spec ファイル | 区分 | カバー TC |
| --- | --- | --- |
| `apps/web/src/features/admin/attendance/__tests__/attendanceFollowLevel.spec.ts` | 新規 | TC-01, TC-02, TC-03, TC-03b |
| `apps/web/src/features/admin/attendance/__tests__/AttendanceDetailTabs.spec.tsx` | 新規 | TC-04〜TC-10, TC-16 |
| `apps/web/src/features/admin/attendance/__tests__/AttendancePrimaryHero.spec.tsx` | 新規 | TC-13, TC-14, TC-15, TC-17 |
| `apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx` | 追従（既存編集） | TC-11, TC-12, TC-11b |

## 8. Red 状態の確認

- 新規 3 spec + KpiPanel 追従分は Phase 5 実装前は **全 fail**（`attendanceFollowLevel` / `AttendanceDetailTabs` / hero 化 / `data-attendance-follow` が未実装のため）。
- 既存 TC-18〜TC-20 は実装前から pass（lib / Trend / Zone は不変）。

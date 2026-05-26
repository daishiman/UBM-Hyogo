[実装区分: 実装仕様書]

# Task D — /admin/dashboard/attendance の features/admin primitive 化（孤立島の解消）

- 親 workflow: `docs/30-workflows/admin-ui-prototype-alignment/`
- Branch: `feat/admin-ui-prototype-alignment`
- スコープ: `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` 単一画面の primitive 整流
- 関連タスク（依存・分離）:
  - Task A（layout / sidebar）— 本タスクは依存しない
  - Task B（dashboard 404 / byZone）— 別画面
  - Task C（AdminPageHeader を 8 admin page へ統合）— **本タスクは Task C の AdminPageHeader 提供を前提とする**
  - Task E（visual baseline）— 本タスクで snapshot は導入するが、baseline 撮影は Task E 側

---

## Phase 1: Requirements / 要件

### 1.1 背景

`/admin/dashboard/attendance` は ut-02a-followup-002 で追加された画面で、`safeServerFetch` で 3 endpoint を並列取得して KPI + 2 テーブルを描画する。
features/admin の primitive 群（`KpiGrid` / `AdminTable` / `AdminPageHeader`）が他 dashboard で標準採用される一方、本画面は以下の理由で「孤立島」になっている。

- inline で `function KpiCard(...)` を再定義（L131-144）し、`_dashboard/KpiCard.tsx` の tone / hint / tabular-nums / token 化された style を享受していない
- by-session / ranking が裸 `<table>`（L76-95, L108-125）で、sticky header / sort / empty state / token 化 style を持つ `AdminTable` を使っていない
- `<h1>` 直書きで、Task C で全 admin page に統合される `AdminPageHeader`（pretitle / actions slot 付き）を採用していない

プロトタイプ（`docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx`）には attendance 専用画面は存在しないが、`AdminDashboardPage` の構造（`.page-head` → `.grid-4 .card.stat` → `.grid-2`（左 timeline / 右 進捗バー） → `.tbl` ドリルダウン）が **dashboard 系の正本構造** として確立しており、attendance もこの規約に従う。

### 1.2 ゴール

`/admin/dashboard/attendance` を `AdminPageHeader` + `KpiGrid` + `AdminTable` の **3 primitive 構成** に書き換え、features/admin primitive 採用率を本画面で 100% にする。

### 1.3 受け入れ基準（AC）

| ID | 内容 | 検証手段 |
|----|------|---------|
| AC-D1 | `attendance/page.tsx` 内に `<table` 文字列が 0 件 | `grep -c '<table' apps/web/app/\(admin\)/admin/dashboard/attendance/page.tsx` が 0 |
| AC-D2 | `attendance/page.tsx` 内に inline `function KpiCard` 定義が 0 件 | 同 grep `'function KpiCard'` が 0 |
| AC-D3 | `AdminPageHeader` が 1 回以上 import / 採用される | 同 grep `'AdminPageHeader'` が ≥1 |
| AC-D4 | `KpiGrid` または `KpiCard`（`_dashboard/KpiCard`）が 1 回以上採用される | grep `'from .*_dashboard/Kpi'` ≥1 |
| AC-D5 | `AdminTable` が 1 回以上採用される | grep `'AdminTable'` ≥1 |
| AC-D6 | 既存 3 endpoint (`/admin/dashboard/attendance/{overview,by-session,ranking}`) を **新規追加なしで** そのまま利用 | `apps/api/src/routes/admin/dashboard.ts` の diff = 0 行 |
| AC-D7 | `AdminSectionError` による 3 区画の section 単位 fail-soft が維持される | 既存 vitest spec が green |
| AC-D8 | a11y: `<table>` を `AdminTable` に置換しても section の `aria-labelledby` / `role="group"` / `aria-label` が失われない | vitest a11y spec |
| AC-D9 | snapshot: KPI 行 + by-session table + ranking table の 3 region で testid が安定する（`data-testid="attendance-overview" / "attendance-by-session" / "attendance-ranking"`） | vitest snapshot spec |

### 1.4 スコープ外（明示）

- AdminPageHeader **本体の実装**（Task C 側で完了済前提）
- layout / sidebar / breadcrumb 変更（Task A）
- dashboard 本体 / byZone（Task B）
- staging visual baseline 撮影（Task E）
- API endpoint の新規追加 / response shape 変更
- attendance period filter の UI / API 実装（本タスクは refresh self-link のみ）

### 1.5 不変条件

- 既存 API endpoint surface 維持（不変条件 #5 の D1 直接アクセス禁止）
- `safeServerFetch` 経由を継続
- OKLch tokens のみ（HEX 直書き / `bg-[#xxx]` 禁止）
- 新規 primitive は作らない。rate の視覚表現は `AdminTableColumn.render` に閉じる。

---

## Phase 2: Design / 設計

### 2.1 画面構成図（再構成後）

```
<section aria-labelledby="admin-attendance-dashboard-h">
  <AdminPageHeader
    pretitle="ダッシュボード"
    title="出席分析"           // <h1 id="admin-attendance-dashboard-h">
    actions={<AttendanceHeaderActions />}   // refresh self-link のみ
  />

  {/* (1) KPI 行 — grid-4 */}
  <div data-testid="attendance-overview">
    {overviewR.ok
      ? <KpiCard label=... value=... /> × 3   // 既存 _dashboard/KpiCard を直接 3 枚
      : <AdminSectionError ... />}
  </div>

  {/* (2) セッション別 table。rate cell は render prop で inline progress bar + pct 表示 */}
  <section data-testid="attendance-by-session">
    <h2>セッション別出席状況</h2>
    <AdminTable columns={...} rows={bySessionR.data} ... />
  </section>

  {/* (3) ドリルダウン — 会員ランキング table */}
  <section data-testid="attendance-ranking">
    <h2>会員別出席ランキング</h2>
    <AdminTable columns={...} rows={rankingR.data} defaultSort={{key:"rate",order:"desc"}} ... />
  </section>
</section>
```

### 2.2 KPI mapping

| AdminAttendanceDashboardPage 既存 inline | 置換後 |
|---|---|
| `<KpiCard label="総セッション数" value={String(...totalSessions)} />` | `<KpiCard label="総セッション数" value={overviewR.data.totalSessions} testId="attendance-kpi-total-sessions" />`（`_dashboard/KpiCard` は `value: number`） |
| `<KpiCard label="対象会員数" value={String(...totalMembers)} />` | `<KpiCard label="対象会員数" value={overviewR.data.totalMembers} testId="attendance-kpi-total-members" />` |
| `<KpiCard label="全体出席率" value={fmtPct(overallRate)} />` | `<KpiCard label="全体出席率" value={Math.round(overallRate * 1000) / 10} hint="%" tone={overallRate >= 0.7 ? "success" : overallRate >= 0.5 ? "warning" : "danger"} testId="attendance-kpi-overall-rate" />`<br>※ KpiCard の value は number 固定なので、小数 1 桁の % 表示が必要なら **新規 prop 追加せず** `hint="%"` で単位を補足する |

現行 `KpiCard.value` は `number` で固定する。全体出席率は `Math.round(overallRate * 1000) / 10` を value に渡し、`hint="%"` で単位を表す。`unit` / `formatter` prop は追加しない。

### 2.3 AdminTable column 定義（by-session / ranking）

**by-session**:
```ts
columns: [
  { key: "heldOn",        header: "開催日",   accessor: r => r.heldOn,        sortable: true,  align: "left"  },
  { key: "title",         header: "タイトル", accessor: r => r.title,         sortable: true,  align: "left"  },
  { key: "attendeeCount", header: "出席者数", accessor: r => r.attendeeCount, sortable: true,  align: "right" },
  { key: "rate",          header: "出席率",   accessor: r => r.rate, render: r => fmtPct(r.rate), sortable: true, align: "right" },
],
getRowKey: r => r.sessionId,
defaultSort: { key: "heldOn", order: "desc" },
emptyState: <AdminEmptyState title="セッション別出席データがありません" testId="attendance-by-session-empty" />,
```

**ranking**:
```ts
columns: [
  { key: "displayName",   header: "会員",   accessor: r => r.displayName || r.memberId, sortable: true, align: "left"  },
  { key: "attendedCount", header: "出席数", accessor: r => r.attendedCount, sortable: true, align: "right" },
  { key: "rate",          header: "出席率", accessor: r => r.rate, render: r => fmtPct(r.rate), sortable: true, align: "right" },
],
getRowKey: r => r.memberId,
defaultSort: { key: "rate", order: "desc" },
emptyState: <AdminEmptyState title="会員別出席データがありません" testId="attendance-ranking-empty" />,
```

### 2.4 可視化 primitive 判定（ZoneDistribution 派生 vs 新規 AttendanceRateBar）

`_dashboard/ZoneDistribution.tsx` は以下のシグネチャ:

```ts
interface ZoneDistributionProps { readonly slices: ReadonlyArray<ZoneSlice> | undefined }
type ZoneSlice = { zone: string; count: number }
```

attendance で表現したいのは **「区画別の出席率」** だが、現行 3 endpoint には区画別 breakdown が **ない**。overview は `{totalSessions, totalMembers, overallRate}` のみ。

→ **判定: 本タスクでは AttendanceRateBar を新規に作らない。ZoneDistribution の派生もしない。** 理由:

1. 新 endpoint 追加禁止（AC-D6 / 不変条件 #5）
2. 既存 overview / by-session のデータのみで「区画別の bar」は作れない
3. 「session 別出席率」は AdminTable で十分表現できる（AdminTable に bar visualization を render prop で埋め込むほうが整合的）

**決定**: `grid-2` の左セルは作らず、画面構成を `KpiGrid -> by-session AdminTable -> ranking AdminTable` の縦 3 段にする。プロトタイプの「主要指標を先頭、詳細は表で比較」という意味だけを採用し、データが存在しない可視化 primitive は増やさない。`rate` カラムは `AdminTableColumn.render` で `fmtPct(rate)` と token 化された inline progress bar を同じセル内に描画し、新 endpoint なしで視覚的な比較性を補う。

### 2.5 AdminPageHeader actions slot

```tsx
<AdminPageHeader
  pretitle="ダッシュボード"
  title="出席分析"
  actions={
    <div className="flex items-center gap-2">
      <a className="ui-btn ui-btn--ghost" href="/admin/dashboard/attendance" data-testid="attendance-refresh">
        再取得
      </a>
    </div>
  }
/>
```

`a href=self` での再取得は SSR force-dynamic と合わせて最小コストの refresh CTA として成立するため、本タスク内で完結させる。期間 filter は `disabled` ではなく非表示とし、未接続 UI を残さない。

---

## Phase 3: Design Review

- 既存 `_dashboard/KpiCard` の `value: number` 制約が「`overallRate` を % 文字列にして渡す」既存 UX と齟齬がないか → 2.2 の hint 案で吸収
- `AdminTable` は client component（`"use client"`）。attendance page は `async` server component なので、AdminTable 採用箇所は **client 境界を跨ぐ** → props は serializable のみ（columns の `render` prop は client 側評価なので OK だが、columns 配列を server component から渡す形になる。これは 8 章で AdminTable が他 admin page で実証済みのため許容）
- AttendanceRateBar を作らない判定は親 workflow の primitive inventory 方針と整合する（Phase 1 「新規 primitive 最小化」）。rate の視覚表現は AdminTable render prop に閉じる。

---

## Phase 4: Test Plan

| ID | 種別 | 観点 |
|----|------|------|
| T-D-01 | vitest snapshot | `attendance/page.tsx` の 3 区画 testid が安定 |
| T-D-02 | vitest a11y | `<section aria-labelledby="admin-attendance-dashboard-h">` 保存 / KpiCard の `role` / AdminTable の `<caption>` または `aria-label` |
| T-D-03 | vitest data-rendering | overview ok → KpiCard 3 枚 / by-session 行数 = data.length / ranking sort = rate desc |
| T-D-04 | vitest fail-soft | 3 endpoint いずれかが `ok: false` のとき該当区画のみ AdminSectionError、他区画は描画継続 |
| T-D-05 | grep gate (CI / lefthook) | `<table` 0 / `function KpiCard` 0 / `AdminPageHeader` ≥1 / `AdminTable` ≥1 |

---

## Phase 5: Implementation

### 5.1 変更ファイル

| ファイル | 操作 | 主旨 |
|---------|------|------|
| `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` | 書き換え | inline KpiCard 削除 / 裸 table → AdminTable / AdminPageHeader 採用 |
| `apps/web/src/features/admin/components/__tests__/attendance-page.spec.tsx` | 新規 | T-D-01..04 |
| `apps/web/src/features/admin/components/_attendance/AttendanceRateBar.tsx` | **新規作成しない**（Phase 2.4 判定） | — |

### 5.2 API → UI mapper シグネチャ

mapper は専用ファイルに切り出さず、page.tsx 内 module-local 関数として保持（既存 `fmtPct` と同じ階層）:

```ts
// page.tsx 内
const fmtPct = (rate: number): string => `${(rate * 100).toFixed(1)}%`;

function toBySessionColumns(): AdminTableColumn<SessionAttendanceRow>[] { /* 2.3 */ }
function toRankingColumns():   AdminTableColumn<MemberAttendanceRanking>[] { /* 2.3 */ }
function toneForRate(rate: number): KpiTone {
  if (rate >= 0.7) return "success";
  if (rate >= 0.5) return "warning";
  return "danger";
}
```

### 5.3 差分方針

- L4-5 の import に `AdminPageHeader` / `AdminTable` / `AdminEmptyState` / `KpiCard` を追加、`AdminSectionError` は維持
- L44-45 の `<section>` + `<h1>` を `AdminPageHeader` の wrapper に置換（`<section aria-labelledby>` は維持し、その内側 1 行目に `AdminPageHeader` を置く）
- L47-64 KPI 行: 既存 `<div className="kpi-grid">` を KpiCard 3 枚の grid に置換（独自 className 廃止）
- L66-95 by-session: `<table>` を `<AdminTable>` に置換、loading / empty / error 3 状態は AdminTable の `emptyState` と外側の AdminSectionError 分岐で表現
- L98-125 ranking: 同上
- L131-144 inline `function KpiCard` を **削除**

---

## Phase 6: Test Additions

### 6.1 snapshot spec (T-D-01)

`apps/web/src/features/admin/components/__tests__/attendance-page.spec.tsx`:

```ts
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../lib/admin/safe-server-fetch", () => ({
  safeServerFetch: vi.fn(),
}));

describe("attendance dashboard page", () => {
  it("renders 3 testid regions when all endpoints ok", async () => {
    // arrange: 3 mocks ok
    // act: render(await AdminAttendanceDashboardPage())
    // assert: getByTestId("attendance-overview") / ("attendance-by-session") / ("attendance-ranking")
  });
});
```

### 6.2 a11y spec (T-D-02)

- `getByRole("group", { name: "出席サマリー" })` が存在
- `getByRole("heading", { level: 1, name: /出席/ })` が `AdminPageHeader` から発火
- AdminTable の `<table>` が `aria-label` または `<caption>` を 1 つ持つ

### 6.3 data-rendering spec (T-D-03)

- mocks に固定 fixture を流し、`getAllByRole("row")` 数 = data.length + 1（header）
- ranking の `defaultSort: rate desc` を assert（最初の row が最高 rate）

### 6.4 fail-soft spec (T-D-04)

- overview だけ `ok: false` → `AdminSectionError` 1 件 + by-session / ranking テーブルは描画
- by-session 空配列 → AdminEmptyState（`attendance-by-session-empty` testid）

---

## Phase 7: Coverage

- 変更対象は単一 page.tsx + 1 spec ファイルのため delta coverage 影響は限定的
- attendance page の line / branch coverage を before/after で記録（pre-push `coverage-guard.sh` の差分閾値内）

---

## Phase 8: Refactor

- inline KpiCard 削除に伴い `_dashboard/KpiCard` への参照が attendance 経路で初めて発生 → barrel export (`_dashboard/index.ts` or `components/index.ts`) があれば追記、なければ直接 path import を維持（Task C と path 規約を揃える）
- by-session / ranking 共通の `fmtPct` は module-local に維持する。既存 utility 化は行わない。

---

## Phase 9: QA

- ローカル: `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` / `pnpm --filter web test -- attendance-page`
- 手動: dev server で `/admin/dashboard/attendance` 3 状態確認（all ok / overview err / by-session 空）

---

## Phase 10: Final Review

- AC-D1..D9 を grep / vitest で機械検証
- 親 workflow Phase 9 の cross-page consistency review に merge
- 不変条件チェック: HEX 直書き 0 / `<input>` 直書きなし / D1 直接アクセスなし

---

## Phase 11: Manual Test Evidence

- ローカル `pnpm --filter web dev` で `/admin/dashboard/attendance` を開き、KpiGrid / AdminTable / AdminPageHeader が描画されることをスクリーンショット
- staging visual baseline 撮影は **Task E 側** で実施（本タスクの evidence は localhost のみ）

---

## Phase 12: Documentation / unassigned task detection

### 12.1 反映先

- 親 workflow `phase-5-implementation.md` の Task D 章に本仕様を要約反映
- `apps/web/src/features/admin/components/_dashboard/README.md`（存在すれば）に attendance 採用を追記
- task-spec-creator skill `patterns-lessons` に「孤立島 primitive の整流は同一画面内で完結させる（新 endpoint 追加禁止下では可視化 primitive を増やさない）」を 1 行追加

### 12.2 unassigned task detection（候補と判定）

| 候補 | 判定 | 理由 |
|------|------|------|
| 区画別出席率 endpoint 追加 + `AttendanceRateBar` 新規 primitive | **本 workflow では作らない** | 新 endpoint 禁止の不変条件に抵触するため、今回の改善対象ではない。将来プロダクト要件として採用する場合はユーザー承認後に別 workflow で扱う |
| header の period filter client island 化 | **作らない** | 期間 API / query 契約が無い状態の UI は未接続 control になる。refresh は self-link で完結 |
| KpiCard に `unit?: string` / `formatter?` prop 追加 | **作らない** | 現行 `KpiCard.value: number` を維持し、率は `value=Math.round(rate*1000)/10` + `hint="%"` で表現する |
| AdminTable rate cell の inline progress bar | **本タスクで実施** | 新 primitive を増やさず比較性を補えるため |

### 12.3 中学生レベル概念説明

- **primitive**: 画面のレゴブロック。同じブロックを使い回せば見た目と動作がそろう。
- **孤立島**: 1 つの画面だけが他とちがう作り方をしている状態。直すと保守が楽になる。
- **fail-soft**: 一部の取得が失敗しても、残りは表示し続ける作り方。

---

## Phase 13: PR

- Base: `dev`
- Title 案: `refactor(admin-dashboard-attendance): adopt KpiGrid / AdminTable / AdminPageHeader (Task D)`
- Body: 親 workflow `phase-13-pr.md` の template を流用、AC-D1..D9 を checklist で記載
- 関連 issue: 親 workflow Issue（admin-ui-prototype-alignment）に `Refs` で紐付け

---

## Definition of Done (DoD)

- [ ] `attendance/page.tsx` が `AdminPageHeader` + `KpiCard`(×3) + `AdminTable`(×2) で構成されている
- [ ] inline `function KpiCard` が削除されている（grep 0 件）
- [ ] 裸 `<table>` が 0 件（grep 0 件）
- [ ] 既存 3 endpoint への呼び出し / shape / safeServerFetch 経由が維持されている
- [ ] AdminSectionError による 3 区画 fail-soft が維持されている
- [ ] T-D-01..04 vitest が green
- [ ] `mise exec -- pnpm typecheck` / `pnpm lint` green
- [ ] OKLch tokens のみ（HEX / `bg-[#xxx]` 0 件）
- [ ] 親 workflow Phase 5 / Phase 12 に Task D の反映が記載されている
- [ ] 未接続 UI / 新 endpoint 追加を本タスクに残していない

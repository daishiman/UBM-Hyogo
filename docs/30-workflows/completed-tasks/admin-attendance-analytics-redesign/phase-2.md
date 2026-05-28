[実装区分: 実装仕様書]

# Phase 2: 設計

> Phase 1 依存: `phase-1.md`（要件定義 / inventory / 命名規則 / タスク分類 = UI task VISUAL / implementation_mode = `new`）が完了していること。Phase 1 で確定した shared-context（`_shared-context.md`）と本書の差分は無いこと（差分があれば Phase 1 に戻る）。

本書は Admin 出席分析ページ UI/UX 全面刷新 + API 拡張ワークフロー の設計仕様。Phase 5 の実装、Phase 4 のテスト作成、Phase 3 の設計レビューが、本書のみを参照して進行できる粒度で記述する。

---

## 0. 設計原則 / 制約サマリ

- 既存 admin gate 二段防御（Web middleware + API `requireAdmin`）を維持。
- D1 直接参照は `apps/api` に閉じる。`apps/web` は `safeServerFetch<T>()` 経由のみ。
- API ベースパスは `/admin/dashboard/attendance/*` に閉じる（新規ベースパス追加禁止）。
- limit は `1..200` clamp（既存規約）。本タスクで追加する `periodFrom` / `periodTo` / `zone` / `lastN` / `granularity` も同様に default fallback で 400 を投げない（不正値は default 値で続行 + response の `appliedFilters` でエコーバック）。
- Design Token: `--ubm-*` のみ使用。HEX 直書き禁止。
- 型の公開は subpath export (`@repo/shared/types/admin-attendance` / `@repo/shared/zod/admin-attendance`)。`@repo/shared` root barrel への追加禁止（FB-W0-01 衝突回避）。
- 集計分母: active のみ（`meeting_sessions.deleted_at IS NULL` / `member_status.is_deleted != 1`）。
- ソート不変: `held_on DESC, session_id DESC`。

---

## 1. トポロジ図（end-to-end）

```
[Browser]
  │  GET /(admin)/admin/dashboard/attendance?period=3M&zone=0-1,1-10
  ▼
[Next.js App Router – Server Component]   ← apps/web/app/(admin)/admin/dashboard/attendance/page.tsx
  │   (force-dynamic / cache: 'no-store')
  │   URL searchParams → AttendanceFilters
  │   委譲: <AttendanceAnalyticsPage filters={...} />
  ▼
[Server-side aggregator]                   ← apps/web/src/lib/admin/fetch-attendance.ts
  │   Promise.all([
  │     overview, by-session, ranking, trend, zone-distribution, absentees
  │   ])  ※ drilldown / export は client から個別 fetch
  ▼
[safeServerFetch<T>()]                     ← apps/web/src/lib/admin/safe-server-fetch.ts
  │   SafeResult<T | SafeResultError>
  │   error code: ADMIN_FETCH_[STATUS]
  ▼
[Internal proxy fetcher]                   ← apps/web/src/lib/admin/server-fetch.ts
  │   INTERNAL_API_BASE_URL + 'x-internal-auth'
  ▼
[Cloudflare Workers – Hono Router]         ← apps/api/src/index.ts → routes/admin/*.ts
  │   requireAdmin middleware (JWT HS256)
  │   Zod validation (input querystring)
  ▼
[Repository: attendance-analytics]         ← apps/api/src/repository/attendance-analytics.ts
  │   pure SQL aggregation (期間/zone 引数追加)
  ▼
[D1 binding]                               ← meeting_sessions / member_attendance / member_status
```

Client interactive layer (browser 内):

```
[AttendanceAnalyticsPage (Server)]
  └─ [Client island: AttendanceAnalyticsView]
       ├─ filter state ← URL searchParams (router.replace で同期)
       ├─ Drilldown Modal → fetch /api/admin/.../sessions/:id/attendees
       └─ CSV Export → window.location = /api/admin/.../export?...
```

---

## 2. 責務境界（レイヤ別の Who-Owns-What）

| Layer | 責務 | 持つもの | 持たないもの |
|-------|------|----------|--------------|
| **Browser (URL)** | フィルタの永続化と共有可能性 | `?period=` / `?zone=` / `?from=` / `?to=` | session / cookie 以外の state |
| **Server Component (`page.tsx`)** | URL → filter 解釈、初回データの並列フェッチ、エラー降格表示 | `searchParams` 読み取り、`Promise.all`、各 section の `AdminSectionError` 降格 | client state, drilldown, export |
| **`fetch-attendance.ts` (server)** | 6 endpoint 並列取得 + `SafeResult` 正規化 | 各 endpoint の URL 組み立て、partial failure 集約 | UI 表示 |
| **Client island (`AttendanceAnalyticsView`)** | UI 表示 state、modal 開閉、CSV ボタン、フィルタ変更時の `router.replace` | drilldown / export の client fetch | サーバー集計 |
| **Workers handler (`routes/admin/attendance-*.ts`)** | querystring 検証（Zod, clamp）、JWT admin gate、repository 呼び出し、Response 整形 | SQL 直接生成、CSV 文字列生成（→ lib へ委譲） | filter UI |
| **Repository (`attendance-analytics.ts`)** | active 行のみで集計 SQL を発行、period / zone 引数を受けて WHERE を組む、純粋関数 | HTTP 詳細、JWT、CSV 整形 |
| **`lib/csv-export.ts`** | 行配列 → RFC4180 準拠 CSV 文字列化、BOM/Content-Disposition ヘッダ生成 | DB アクセス, HTTP routing |
| **D1** | 永続化のみ | 集計ロジック（view も使わない、apps/api 側 SQL に集約） |

---

## 3. State Ownership

| State 種別 | 主管 | 補足 |
|-----------|------|------|
| フィルタ（period / zone / from / to / lastN） | **URL searchParams** | Server Component が解釈し、Client 変更時は `router.replace(pathname + '?' + qs, { scroll: false })`。再同期 effect: searchParams 変更 → useAttendanceFilters の derived state を再計算 |
| 表示用 UI state（modal 開閉、選択中 sessionId、export loading） | **Component 内 `useState`** | URL に出さない（共有不要 / 反映ノイズになる） |
| サーバーキャッシュ | **fetch 層 (`force-dynamic` + `cache: 'no-store'`)** | 初回フル fetch を厳守。SWR 不要（admin / 件数少 / fresh 最優先）。詳細は §15 |
| Drilldown 取得済みデータ | **Modal 内 `useState` + 単一 fetch** | キャッシュ不要、Modal close で破棄 |

### filter state ownership（FB-STATE-DETAIL-003 対応）

- 親 (Server Component) は URL → 初回 filter として props で渡すのみ（一方向）。
- 子 (`AttendanceAnalyticsView`) は `useAttendanceFilters(initial: AttendanceFilters)` フックを使用。
- **再同期 effect 必須**: `useEffect(() => { setInternal(initialFromUrl) }, [initialFromUrl])` を `useAttendanceFilters` 内に実装。これによりブラウザ戻る/進む（URL 変化）と initial prop の更新が internal state に反映される。
- ロック変数: `isApplyingFiltersRef` を `useRef(false)` で持ち、`router.replace` の `finally` で必ず解放（FB-STATE-DETAIL-001/003 ロック解放テーブル）。

---

## 4. UI 構造（コンポーネント階層）

```
AttendanceAnalyticsPage (Server Component)                  [props: searchParams]
├─ AdminPageHeader                                          [既存再利用]
│    title: "出席分析"
├─ Suspense fallback={<AdminSectionCardSkeleton />}
│  └─ AttendanceAnalyticsView (Client)                      [props: initialData, initialFilters]
│      ├─ AttendanceFiltersBar                              [新規]
│      │   ├─ AttendancePeriodFilter                        [新規 / Segmented]
│      │   │     props: { value: PeriodPreset; onChange }
│      │   ├─ AttendanceZoneFilter                          [新規 / Checkbox group]
│      │   │     props: { values: Zone[]; onChange }
│      │   └─ AttendanceExportButton                        [新規]
│      │         props: { filters: AttendanceFilters }
│      │
│      ├─ KpiPanel (.grid-4)                                [新規]
│      │   children: 4 × AdminStat (既存再利用)
│      │       - 全体出席率 / 総出席者数 / 平均出席数 / 前期比トレンド
│      │
│      ├─ ChartSection (.grid-2)                            [新規 container]
│      │   ├─ AttendanceTrendChart                          [新規]
│      │   │     props: { data: AttendanceTrend }
│      │   └─ AttendanceZoneDistributionChart               [新規]
│      │         props: { rows: AttendanceZoneDistributionRow[] }
│      │
│      ├─ SessionAttendanceTable                            [新規 / AdminTable 拡張]
│      │     props: { rows: SessionAttendanceRow[]; onRowClick(sessionId) }
│      │
│      ├─ MemberAttendanceTable                             [新規 / AdminTable 拡張]
│      │     props: { rows: MemberAttendanceRanking[] }
│      │
│      ├─ AttendanceTop10Ranking                            [新規]
│      │     props: { rows: MemberAttendanceRanking[] (top 10) }
│      │
│      ├─ AttendanceAbsenteeAlert                           [新規]
│      │     props: { absentees: AttendanceAbsentee[]; lastN: number }
│      │
│      └─ AttendanceDrilldownModal                          [新規]
│            props: { sessionId: string | null; onClose() }
│
└─ 各セクションで partial failure → <AdminSectionError code="..." message="..." />
```

各 section card は **既存 `AdminSectionCard` でラップ**し、エラーは **`AdminSectionError`** で degrade（page-level error.tsx へ throw しない）。

---

## 5. API DTO 設計（Zod スキーマ詳細）

配置: `packages/shared/src/zod/admin-attendance.ts`（新規）。subpath export `@repo/shared/zod/admin-attendance`。型は `packages/shared/src/types/admin-attendance.ts` で `z.infer` を re-export。

### 5.1 共通

```ts
export const PeriodPresetZ = z.enum(['THIS_MONTH', '3M', '6M', '1Y', 'ALL', 'CUSTOM']);
export const ZoneZ = z.enum(['0->1', '1->10', '10->100', 'unknown']);
export const GranularityZ = z.enum(['month']); // 初回 month のみ

export const AttendanceFiltersAppliedZ = z.object({
  periodFrom: z.string().nullable(),   // 'YYYY-MM-DD' or null=ALL
  periodTo: z.string().nullable(),
  zones: z.array(ZoneZ),               // 空 = 全 zone
}).strict();
```

### 5.2 既存拡張（`viewmodel.ts`）

```ts
// 既存 AttendanceOverviewZ を strict で拡張
export const AttendanceOverviewZ = z.object({
  totalSessions: z.number().int().nonnegative(),
  totalMembers: z.number().int().nonnegative(),
  overallRate: z.number().min(0).max(1),
  previousPeriodRate: z.number().min(0).max(1).nullable(), // 比較対象がない場合 null
  appliedFilters: AttendanceFiltersAppliedZ,
}).strict();

// SessionAttendanceRowZ / MemberAttendanceRankingZ は既存形状を維持し
// レスポンス本体を { rows, appliedFilters } で wrap する新スキーマを追加
export const SessionAttendanceListZ = z.object({
  rows: z.array(SessionAttendanceRowZ),
  appliedFilters: AttendanceFiltersAppliedZ,
}).strict();

export const MemberAttendanceRankingListZ = z.object({
  rows: z.array(MemberAttendanceRankingZ),
  appliedFilters: AttendanceFiltersAppliedZ,
}).strict();
```

### 5.3 新規 DTO

```ts
export const AttendanceTrendBucketZ = z.object({
  period: z.string(),                       // 'YYYY-MM' (granularity=month)
  attendeeCount: z.number().int().nonnegative(),
  sessionCount: z.number().int().nonnegative(),
  uniqueMemberCount: z.number().int().nonnegative(),
}).strict();

export const AttendanceTrendZ = z.object({
  granularity: GranularityZ,
  buckets: z.array(AttendanceTrendBucketZ),
  appliedFilters: AttendanceFiltersAppliedZ,
}).strict();

export const AttendanceZoneDistributionRowZ = z.object({
  zone: ZoneZ,
  attendeeCount: z.number().int().nonnegative(),
  rate: z.number().min(0).max(1),
}).strict();

export const AttendanceZoneDistributionZ = z.object({
  rows: z.array(AttendanceZoneDistributionRowZ),
  appliedFilters: AttendanceFiltersAppliedZ,
}).strict();

export const AttendanceSessionAttendeeZ = z.object({
  memberId: z.string(),
  displayName: z.string(),
  zone: ZoneZ,
}).strict();

export const AttendanceSessionDetailZ = z.object({
  sessionId: z.string(),
  title: z.string(),
  heldOn: z.string(),
  attendees: z.array(AttendanceSessionAttendeeZ),
  absentees: z.array(AttendanceSessionAttendeeZ),
}).strict();

export const AttendanceAbsenteeZ = z.object({
  memberId: z.string(),
  displayName: z.string(),
  zone: ZoneZ,
  lastAttendedAt: z.string().nullable(),
  missedCount: z.number().int().nonnegative(),
}).strict();

export const AttendanceAbsenteeListZ = z.object({
  lastN: z.number().int().min(1).max(20),
  rows: z.array(AttendanceAbsenteeZ),
  appliedFilters: AttendanceFiltersAppliedZ,
}).strict();
```

### 5.4 querystring 入力 Zod（apps/api 内）

```ts
const QueryFiltersZ = z.object({
  periodFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  periodTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  zone: z.string().optional(),  // 'zone=0->1,1->10' → split(',')
  limit: z.coerce.number().int().optional(),       // 1..200 clamp 後使用（既存 helper）
  lastN: z.coerce.number().int().min(1).max(20).optional(),
  granularity: GranularityZ.optional(),
  format: z.enum(['csv']).optional(),
});
```

不正値は **`.safeParse` 失敗時に default fallback**（period 系: 全期間 / zone: 全 zone / limit: 50 / lastN: 3 / granularity: 'month'）。400 を投げない。

---

## 6. 新規 / 編集ファイル一覧（関数シグネチャ付き）

### 6.1 新規 / `apps/api`

| ファイル | 公開関数 / handler | シグネチャ |
|---|---|---|
| `apps/api/src/routes/admin/attendance-trend.ts` | `getAttendanceTrend` | `(c: Context) => Promise<Response>` |
| `apps/api/src/routes/admin/attendance-zone-distribution.ts` | `getAttendanceZoneDistribution` | `(c: Context) => Promise<Response>` |
| `apps/api/src/routes/admin/attendance-session-detail.ts` | `getAttendanceSessionDetail` | `(c: Context) => Promise<Response>` |
| `apps/api/src/routes/admin/attendance-absentees.ts` | `getAttendanceAbsentees` | `(c: Context) => Promise<Response>` |
| `apps/api/src/routes/admin/attendance-export.ts` | `getAttendanceExportCsv` | `(c: Context) => Promise<Response>` |
| `apps/api/src/repository/attendance-analytics.ts` | `computeAttendanceTrend(db, args)` | `(db: D1Database, args: { from: string\|null; to: string\|null; zones: Zone[]; granularity: 'month' }) => Promise<AttendanceTrendBucket[]>` |
| 同上 | `computeZoneDistribution(db, args)` | `(db, args: { from, to }) => Promise<AttendanceZoneDistributionRow[]>` |
| 同上 | `fetchSessionDetail(db, sessionId)` | `(db, id: string) => Promise<AttendanceSessionDetail \| null>` |
| 同上 | `listAbsentees(db, args)` | `(db, args: { from, to, zones, lastN }) => Promise<AttendanceAbsentee[]>` |
| 同上 | `computeOverviewWithFilters(db, args)` | 既存 `computeAttendanceOverview` を **薄くラップ**し period/zone 引数追加。後方互換のため既存も export 維持 |
| `apps/api/src/lib/csv-export.ts` | `toCsv(rows, columns)` | `<T>(rows: T[], columns: { key: keyof T; header: string; format?: (v) => string }[]) => string` |
| 同上 | `csvResponse(filename, body)` | `(filename: string, body: string) => Response`（`Content-Type: text/csv; charset=utf-8`、`Content-Disposition: attachment; filename*=UTF-8''<encoded>`、BOM 付与） |
| `apps/api/src/lib/attendance-query.ts` | `parseAttendanceFilters` | `(qs: URLSearchParams) => { from: string\|null; to: string\|null; zones: Zone[]; appliedFilters: AttendanceFiltersApplied }`（default fallback 集約） |

### 6.2 編集 / `apps/api`

- `apps/api/src/index.ts`: 新 5 ルートを `requireAdmin` 配下に登録。
- `apps/api/src/routes/admin/dashboard.ts:88-122`: 既存 3 endpoint に `parseAttendanceFilters` を適用し、response を **wrap 形式（`{ rows, appliedFilters }`）に変更**。overview は `previousPeriodRate` を追加。
- `apps/api/src/repository/attendance.ts:455-563`: 既存 3 関数に `(from, to, zones)` 引数を追加（**defaults で後方互換**）。または attendance-analytics.ts へ移設し本ファイルは re-export とする（FB-04 クラス名衝突回避: §13）。
- `apps/api/migrations`: **追加マイグレーション無し**（既存テーブルで集計可能）。

### 6.3 新規 / `apps/web`

| ファイル | 公開 | シグネチャ |
|---|---|---|
| `apps/web/src/lib/admin/fetch-attendance.ts` | `fetchAttendanceAnalytics` | `(filters: AttendanceFilters) => Promise<{ overview: SafeResult<AttendanceOverview>; bySession: SafeResult<SessionAttendanceList>; ranking: SafeResult<MemberAttendanceRankingList>; trend: SafeResult<AttendanceTrend>; zoneDistribution: SafeResult<AttendanceZoneDistribution>; absentees: SafeResult<AttendanceAbsenteeList> }>` |
| 同上 | `fetchSessionDetail` | `(sessionId: string) => Promise<SafeResult<AttendanceSessionDetail>>` |
| `apps/web/src/features/admin/attendance/lib/format-attendance.ts` | `formatRate(n)` `formatDate(s)` `formatTrendDelta(curr, prev)` | 純関数 |
| `apps/web/src/features/admin/attendance/hooks/useAttendanceFilters.ts` | `useAttendanceFilters` | `(initial: AttendanceFilters) => { filters; setPeriod; setZones; setCustomRange; resetFilters; toQueryString() }` |
| `apps/web/src/features/admin/attendance/components/AttendanceAnalyticsPage.tsx` | default export `AttendanceAnalyticsPage` | `(props: { searchParams: Record<string,string> }) => Promise<JSX.Element>`（Server Component） |
| `apps/web/src/features/admin/attendance/components/AttendanceAnalyticsView.tsx` | default `AttendanceAnalyticsView` | `(props: { initialFilters: AttendanceFilters; initialData: AttendanceInitialData }) => JSX.Element`（`"use client"`） |
| `KpiPanel.tsx` | default | `(props: { overview: AttendanceOverview }) => JSX.Element` |
| `AttendancePeriodFilter.tsx` | default | `(props: { value: PeriodPreset; customFrom?: string; customTo?: string; onChange(next): void }) => JSX.Element` |
| `AttendanceZoneFilter.tsx` | default | `(props: { values: Zone[]; onChange(next: Zone[]): void }) => JSX.Element` |
| `AttendanceTrendChart.tsx` | default | `(props: { data: AttendanceTrend }) => JSX.Element` |
| `AttendanceZoneDistributionChart.tsx` | default | `(props: { rows: AttendanceZoneDistributionRow[] }) => JSX.Element` |
| `SessionAttendanceTable.tsx` | default | `(props: { rows: SessionAttendanceRow[]; onRowClick(sessionId: string): void }) => JSX.Element` |
| `MemberAttendanceTable.tsx` | default | `(props: { rows: MemberAttendanceRanking[] }) => JSX.Element` |
| `AttendanceTop10Ranking.tsx` | default | `(props: { rows: MemberAttendanceRanking[] }) => JSX.Element` |
| `AttendanceAbsenteeAlert.tsx` | default | `(props: { absentees: AttendanceAbsentee[]; lastN: number }) => JSX.Element` |
| `AttendanceDrilldownModal.tsx` | default | `(props: { sessionId: string \| null; onClose(): void }) => JSX.Element` |
| `AttendanceExportButton.tsx` | default | `(props: { filters: AttendanceFilters }) => JSX.Element` |

### 6.4 編集 / `apps/web`

- `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx`: 既存 145 行のロジックを縮退し `AttendanceAnalyticsPage` へ全面委譲。`force-dynamic` 維持。
- `apps/web/src/lib/admin/server-fetch.ts`: §11 の 404 切り分け結果に応じて fixture 切替分岐を修正 / 削除。
- `packages/shared/src/zod/viewmodel.ts`: `AttendanceOverviewZ` 拡張のみ（他は新ファイルへ）。
- `docs/00-getting-started-manual/specs/01-api-schema.md:184-214`: §5 の DTO / 新 endpoint 表を反映（Phase 12 で実施）。

---

## 7. 既存コンポーネント再利用可否（FB-SDK-07-1 対応）

| 既存コンポーネント | 再利用 | 用途 | 備考 |
|---|:-:|---|---|
| `AdminSectionCard` | ◯ | 全 section の枠 | そのまま wrap。新規スタイル追加なし |
| `AdminSectionError` (`AdminSectionErrorClient`) | ◯ | 各 section の degrade 表示 | `code` / `message` の既存 props 構造を踏襲 |
| `AdminTable` | ◯（拡張） | Session / Member テーブル | 行クリック handler を新規 `onRowClick` prop で追加。column 定義は新 components 側で持つ |
| `AdminStat` | ◯ | KPI 4 枚 | label / value / unit / delta（前期比）を既存 props で表現できるか Phase 4 RED 前に確認。delta 表示が不足する場合は `AdminStat` を拡張せず `KpiPanel` 内で composition |
| `AdminPageHeader` | ◯ | タイトル枠 | filter / export ボタンは header 直下の `AttendanceFiltersBar` で別配置 |
| `safeServerFetch` | ◯ | fetch 層 | 仕様変更なし |
| `Modal` 系（既存 admin 内に存在する場合） | 要確認 | Drilldown | 存在しなければ最小実装で新規（`<dialog>` ベース、focus trap / Escape close 必須） |

新規 UI は **container / chart / filter** に限定し、表示の足回り（Card / Stat / Table / Error）は既存資産で揃える方針。

---

## 8. 依存ライブラリ判定（FB-CRONVL-001 同様の Phase 2 実測確認）

### チャート

- **採用候補**: `recharts`（既存採用実績の有無を Phase 4 着手前に `pnpm why recharts` で確認）。代替: `chart.js + react-chartjs-2`。
- **判定手順（Phase 2 で実施し本書に追記）**:
  1. `apps/web` の `package.json` / `pnpm-lock.yaml` を grep し、既に bundle 採用しているチャートライブラリが無いか確認。
  2. 既存採用がある → それを採用（追加依存ゼロ優先）。
  3. 無ければ `recharts` を新規導入。`apps/web/package.json` に追加し、Server Component 直配置不可（SSR で window 参照する場合あり）なので Client component に閉じる。
  4. Bundle size 影響を `pnpm --filter @ubm-hyogo/web build` の output で確認し Phase 9 で記録。

### 期間計算

- `date-fns`（既存採用想定）。無ければ標準 `Intl.DateTimeFormat` + 手書きで `YYYY-MM-DD` 加減算（依存追加回避）。Phase 2 で実測確認。

### CSV

- 追加依存なし。`apps/api/src/lib/csv-export.ts` で 自前実装（RFC4180: ダブルクオート escape / CRLF / BOM 付与）。

> **実測確認チェック（Phase 4 着手前に追記）**:
> - [ ] `pnpm why recharts` 結果: ____
> - [ ] `pnpm why chart.js` 結果: ____
> - [ ] `pnpm why date-fns` 結果: ____
> - [ ] 採用決定（recharts / chart.js / 既存採用ライブラリ / 追加無し）: ____

---

## 9. ステップ間 / コンポーネント間 state 引き渡しテーブル（FB-W1-02b-2 対応）

| トリガ | from | to | 引き渡しデータ | 引き渡し方式 | 反映タイミング |
|---|---|---|---|---|---|
| ページロード | URL searchParams | `AttendanceAnalyticsPage` | `period`, `zone`, `from`, `to`, `lastN` | `searchParams` prop 読み取り | 初回のみ |
| 初回 props | Server Component | `AttendanceAnalyticsView` | `initialFilters`, `initialData`（6 セクション分） | props | 初回マウント時 |
| Filter 変更 | `AttendanceFiltersBar` | `AttendanceAnalyticsView` | `next: AttendanceFilters` | callback prop `onFiltersChange` | 即時（debounce 不要、`router.replace` で URL 同期 → Server Component 再フェッチ） |
| URL 変更（戻る/進む） | router | `useAttendanceFilters` | `initialFilters` | re-mount or props 更新 | `useEffect([initialFilters])` で internal state 再同期 |
| Session 行クリック | `SessionAttendanceTable` | `AttendanceAnalyticsView` | `sessionId: string` | callback `onRowClick` | 同期。view 側 `setSelectedSessionId` |
| Modal 表示確定 | `AttendanceAnalyticsView` | `AttendanceDrilldownModal` | `sessionId` | props | 即時。Modal 内 `useEffect([sessionId])` で fetch |
| Modal close | `AttendanceDrilldownModal` | `AttendanceAnalyticsView` | `null` | callback `onClose` | 即時、内部 state 破棄 |
| Export クリック | `AttendanceExportButton` | Browser | `filters → URL` | `window.location.assign(/api/admin/.../export?...)` | 即時。CSV download 起動 |

ロック解放経路（FB-STATE-DETAIL-001/003 必須）:

| 経路 | 解放方法 |
|---|---|
| 正常完了 | `try { await op(); } finally { lockRef.current = false; }` |
| エラー | 同 `finally` で解放 |
| キャンセル/unmount | `useEffect` cleanup で `cancelled = true` ＋ `lockRef.current = false` |

---

## 10. 詳細設計 appendix

500行制限を守るため、以下の詳細は [phase-2-appendix.md](phase-2-appendix.md) へ責務分離した。

- staging 404 RCA 判定ツリー
- CSV エクスポート方式
- クラス名 / 識別子衝突検査
- IPC / Preload N/A 判定
- キャッシュ戦略
- アクセシビリティ要件
- 要件レビュー思考法 5 項目
- Phase 3 引き渡しチェックリスト

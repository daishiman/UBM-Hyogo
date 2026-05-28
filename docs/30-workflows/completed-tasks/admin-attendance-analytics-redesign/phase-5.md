[実装区分: 実装仕様書]

# Phase 5 — 実装 (GREEN)

> **依存**: Phase 4 (RED) 完了 — 全 contract / vitest / playwright spec が「実装欠如」で fail している状態が出発点。
> **目的**: Phase 4 で書かれた失敗テストを最短距離で GREEN にしつつ、`_shared-context.md` §3 のフル機能を漏れなく実装する。
> **参照 SSOT**: `_shared-context.md` 全節 / `docs/00-getting-started-manual/specs/01-api-schema.md` / `CONST_005`(命名規則 §5)。

---

## A. 実装順序（依存解決を考慮した正しい順）

Phase 4 RED の赤を、依存関係的に「下流→上流」順で潰す。ビルド可能性を保ったまま 1 step ずつ進める。

| # | ステップ | 目的 | 完了判定 |
|---|----------|------|----------|
| 1 | **404 原因特定 → 修正** | shared-context §2 仮説 1〜5 を順次切り分け。`wrangler tail` / `next dev` ログ / staging fetch URL を確認し、原因を PR description に明記。 | staging で `/admin/dashboard/attendance` が 200 を返す（旧 UI のままで OK。差し替えは step 9）。 |
| 2 | **Zod schema 追加** | `packages/shared/src/zod/admin-attendance.ts` を新規作成。既存 `viewmodel.ts` には**追記しない**（FB W0-01: root barrel 衝突回避）。subpath export を `package.json#exports` に追加。 | `pnpm --filter @repo/shared build` 成功・型 import 可能。 |
| 3 | **型 re-export** | `packages/shared/src/types/admin-attendance.ts` で `z.infer` を全て type alias 化。`@repo/shared/types/admin-attendance` で import 可能に。 | `pnpm -w typecheck` 成功。 |
| 4 | **repository 拡張** | `apps/api/src/repository/attendance-analytics.ts` 新規。既存 `attendance.ts` の 3 関数を period/zone 引数受領できる薄い wrapper でラップ。新規集計 5 関数を追加。 | `apps/api/src/repository/__tests__/attendance-analytics.spec.ts` GREEN。 |
| 5 | **API ルート拡張・新設** | (a) 既存 `routes/admin/dashboard.ts:88-122` に `periodFrom/periodTo/zone` clamp 付き受領を追加。(b) 新規 5 ファイル: `attendance-trend.ts` / `attendance-zone-distribution.ts` / `attendance-session-detail.ts` / `attendance-absentees.ts` / `attendance-export.ts`。 | 各 contract spec GREEN。 |
| 6 | **`apps/api/src/index.ts` にルート登録** | step 5 で追加した 5 ルートを `app.route('/admin/dashboard/attendance/...', xxxRouter)` 形式で登録（既存 L15,37-38 と同じパターン）。 | `pnpm --filter @ubm-hyogo/api build` 成功 + smoke contract spec GREEN。 |
| 7 | **Web fetch 層拡張** | `apps/web/src/lib/admin/fetch-attendance.ts` 新規。`safeServerFetch<T>` を 8 endpoint 分ラップし、`AttendanceAnalyticsPage` が呼ぶ集約 API `fetchAttendanceAnalyticsBundle(filters)` を export。 | vitest `fetch-attendance.spec.ts`（Phase 4 で red 化済）GREEN。 |
| 8 | **UI コンポーネント実装** | 基底（`KpiPanel` / `AttendancePeriodFilter` / `AttendanceZoneFilter`）→ 表示（`AttendanceTrendChart` / `AttendanceZoneDistributionChart` / `SessionAttendanceTable` / `MemberAttendanceTable` / `AttendanceTop10Ranking` / `AttendanceAbsenteeAlert`）→ 統合（`AttendanceDrilldownModal` / `AttendanceExportButton`）→ ルート（`AttendanceAnalyticsPage`）。 | RTL spec / Playwright visual GREEN。 |
| 9 | **page.tsx 差し替え** | `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` を新 `AttendanceAnalyticsPage` への委譲のみ（force-dynamic は維持）に置き換え。**partial fix 防止 (FB-CANCEL-004): この step を飛ばすと consumer 未配線で「実装あるのに表示されない」になる**。 | E2E で新 UI が表示される。 |
| 10 | **正本仕様更新** | `docs/00-getting-started-manual/specs/01-api-schema.md:184-214` に新規/拡張 8 endpoint + query 規約 + Zod schema を追記。 | lint-spec-drift スクリプト GREEN（無ければ目視 diff レビュー）。 |

---

## B. 各タスクの詳細

### B-1. 404 原因特定 (step 1)

- **作業**: shared-context §2 仮説を順次切り分け、根本原因を確定。
  - 仮説 1 (D1 空): `wrangler d1 execute ubm-hyogo --remote --command 'select count(*) from meeting_sessions'`
  - 仮説 2 (`INTERNAL_API_BASE_URL` 未設定): Cloudflare Pages env を確認、staging で空なら設定。
  - 仮説 3 (fixture fall-through): `apps/web/src/lib/admin/server-fetch.ts` を読み、`NODE_ENV` や `process.env.UBM_FIXTURE_*` 分岐が staging で誤動作していないか確認。**fixture 残骸があれば削除ではなく env guard で無効化**。
  - 仮説 4 (route 登録漏れ): `apps/api/src/index.ts` の grep。
  - 仮説 5 (`x-internal-auth` 不在で 401→404 化): `safe-fetch.ts` の 401 分岐ロジックを再確認。
- **エラーハンドリング**: 原因確定までは **step 2 以降に進まない**。
- **副作用**: PR description / `phase-5.md` 末尾「実装ログ」セクションに「原因 X / 対処 Y」を記録。

### B-2. Zod schema (`packages/shared/src/zod/admin-attendance.ts` 新規)

```ts
// 期間/区画フィルタ共通
export const AttendanceZoneZ = z.enum(['0→1', '1→10', '10→100', 'unknown']);
export const AttendanceFilterEchoZ = z.object({
  periodFrom: z.string().nullable(),    // ISO date (half-open start, inclusive)
  periodTo:   z.string().nullable(),    // ISO date (half-open end, exclusive)
  zoneFilter: z.array(AttendanceZoneZ).nullable(),
}).strict();

// overview 拡張
export const AttendanceOverviewExtZ = AttendanceOverviewZ.extend({
  filter: AttendanceFilterEchoZ,
  previousPeriodRate: z.number().nullable(),
}).strict();

// trend
export const AttendanceTrendBucketZ = z.object({
  period: z.string(),                   // YYYY-MM
  attendeeCount:     z.number().int().nonnegative(),
  sessionCount:      z.number().int().nonnegative(),
  uniqueMemberCount: z.number().int().nonnegative(),
}).strict();
export const AttendanceTrendZ = z.object({
  granularity: z.literal('month'),
  buckets:     z.array(AttendanceTrendBucketZ),
  filter:      AttendanceFilterEchoZ,
}).strict();

// zone distribution
export const AttendanceZoneDistributionRowZ = z.object({
  zone:          AttendanceZoneZ,
  attendeeCount: z.number().int().nonnegative(),
  rate:          z.number().min(0).max(1),
}).strict();
export const AttendanceZoneDistributionZ = z.object({
  rows:   z.array(AttendanceZoneDistributionRowZ),
  filter: AttendanceFilterEchoZ,
}).strict();

// session detail (drilldown)
const AttendanceMemberRefZ = z.object({
  memberId:    z.string(),
  displayName: z.string(),
  zone:        AttendanceZoneZ,
}).strict();
export const AttendanceSessionDetailZ = z.object({
  sessionId: z.string(),
  title:     z.string(),
  heldOn:    z.string(),
  attendees: z.array(AttendanceMemberRefZ),
  absentees: z.array(AttendanceMemberRefZ),
}).strict();

// absentees
export const AttendanceAbsenteeZ = z.object({
  memberId:        z.string(),
  displayName:     z.string(),
  zone:            AttendanceZoneZ,
  lastAttendedAt:  z.string().nullable(),
  missedCount:     z.number().int().nonnegative(),
}).strict();
export const AttendanceAbsenteeListZ = z.object({
  rows:   z.array(AttendanceAbsenteeZ),
  lastN:  z.number().int().positive(),
  filter: AttendanceFilterEchoZ,
}).strict();
```

- **subpath export** を `packages/shared/package.json#exports` に追加:
  - `"./zod/admin-attendance": { "types": "./dist/zod/admin-attendance.d.ts", "import": "./dist/zod/admin-attendance.js" }`
  - `"./types/admin-attendance": { "types": "./dist/types/admin-attendance.d.ts" }`
- **副作用**: なし（pure schema）。

### B-3. 型 re-export (`packages/shared/src/types/admin-attendance.ts`)

```ts
import type { z } from 'zod';
import type * as S from '../zod/admin-attendance';
export type AttendanceZone               = z.infer<typeof S.AttendanceZoneZ>;
export type AttendanceFilterEcho         = z.infer<typeof S.AttendanceFilterEchoZ>;
export type AttendanceOverviewExt        = z.infer<typeof S.AttendanceOverviewExtZ>;
export type AttendanceTrend              = z.infer<typeof S.AttendanceTrendZ>;
export type AttendanceTrendBucket        = z.infer<typeof S.AttendanceTrendBucketZ>;
export type AttendanceZoneDistribution   = z.infer<typeof S.AttendanceZoneDistributionZ>;
export type AttendanceZoneDistributionRow= z.infer<typeof S.AttendanceZoneDistributionRowZ>;
export type AttendanceSessionDetail      = z.infer<typeof S.AttendanceSessionDetailZ>;
export type AttendanceAbsentee           = z.infer<typeof S.AttendanceAbsenteeZ>;
export type AttendanceAbsenteeList       = z.infer<typeof S.AttendanceAbsenteeListZ>;
```

### B-4. repository (`apps/api/src/repository/attendance-analytics.ts` 新規)

主要シグネチャ:

```ts
export interface AttendanceFilter {
  periodFrom: string | null;            // ISO date inclusive
  periodTo:   string | null;            // ISO date exclusive
  zone:       readonly AttendanceZone[] | null;
}

export async function computeAttendanceOverviewExt(db: D1Database, f: AttendanceFilter): Promise<AttendanceOverviewExt>;
export async function listSessionAttendanceStatsExt(db: D1Database, f: AttendanceFilter, limit: number): Promise<SessionAttendanceRow[]>;
export async function listMemberAttendanceRankingExt(db: D1Database, f: AttendanceFilter, limit: number): Promise<MemberAttendanceRanking[]>;
export async function listAttendanceTrend(db: D1Database, f: AttendanceFilter): Promise<AttendanceTrend>;
export async function listZoneDistribution(db: D1Database, f: AttendanceFilter): Promise<AttendanceZoneDistribution>;
export async function getSessionAttendanceDetail(db: D1Database, sessionId: string): Promise<AttendanceSessionDetail | null>;
export async function listAbsentees(db: D1Database, f: AttendanceFilter, lastN: number): Promise<AttendanceAbsenteeList>;
export async function streamAttendanceExportCsv(db: D1Database, f: AttendanceFilter): Promise<ReadableStream<Uint8Array>>;
```

- **入出力**: `D1Database` のみ依存。fetch / fs / process は触れない（Workers 制約 / FB W1-02b-4）。
- **副作用**: read-only。書き込みなし → audit log 不要。
- **エラーハンドリング**: D1 例外は throw（caller の route が `c.json({code,message},500)` で握る）。空結果は `[]` / `0` / `null` を返し**例外化しない**。
- **SQL 共通条件**:
  - active filter: `WHERE members.deleted_at IS NULL AND members.is_deleted != 1`
  - period: `meeting_sessions.held_on >= ? AND meeting_sessions.held_on < ?`（半開区間）
  - zone は CASE 式で派生してから `IN (?, ?, ...)`（後述 §C）
- **sort**: `held_on DESC, session_id DESC`（CONST_005 §4）。ranking は `attended_count DESC, member_id ASC`。

### B-5. API routes

| ファイル | endpoint | 主要処理 |
|---|---|---|
| `routes/admin/dashboard.ts` (編集) | 既存 3 endpoint | `parseFilter(c.req.query())` を冒頭で呼び、repo に渡す。`requireAdmin` ミドルウェアは既存維持。 |
| `routes/admin/attendance-trend.ts` (新規) | `GET /admin/dashboard/attendance/trend` | `granularity` は `month` 固定 (v1)。`listAttendanceTrend` を呼んで Zod parse して返却。 |
| `routes/admin/attendance-zone-distribution.ts` (新規) | `GET /admin/dashboard/attendance/zone-distribution` | `listZoneDistribution`。 |
| `routes/admin/attendance-session-detail.ts` (新規) | `GET /admin/dashboard/attendance/sessions/:sessionId/attendees` | `getSessionAttendanceDetail`。null は 404。 |
| `routes/admin/attendance-absentees.ts` (新規) | `GET /admin/dashboard/attendance/absentees` | `lastN` を 1〜10 clamp (default 3)。`listAbsentees`。 |
| `routes/admin/attendance-export.ts` (新規) | `GET /admin/dashboard/attendance/export?format=csv` | `streamAttendanceExportCsv` を `c.body(stream, 200, headers)` で返却。`format` 不正は `csv` fallback。 |

- **共通 helper** `apps/api/src/lib/parse-attendance-filter.ts` を新規（無ければ）し、`parseFilter(query) → AttendanceFilter` を export。
- **クエリ clamp 規約**: `limit` 1〜200 (default 50)、`lastN` 1〜10 (default 3)、`zone` 不明値は drop、`periodFrom/To` 不正は `null` fallback。**400 は返さない** (`01-api-schema.md:186-194`)。
- **エラーハンドリング**: 401/403 は `requireAdmin` 任せ。500 は `{ code: 'ADMIN_INTERNAL', message }` で返す。

### B-6. `apps/api/src/index.ts` 編集

既存 L15,37-38 と同じパターンで 5 router を import / `app.route()` 登録。**この step を忘れると新ルートが 404 = partial fix (FB-CANCEL-004)**。

### B-7. Web fetch (`apps/web/src/lib/admin/fetch-attendance.ts` 新規)

```ts
import { safeServerFetch } from './safe-server-fetch';
import type { /* 全 type */ } from '@repo/shared/types/admin-attendance';

export interface AttendanceFiltersDTO {
  periodFrom: string | null;
  periodTo:   string | null;
  zones:      readonly AttendanceZone[] | null;
  limit?:     number;
  lastN?:     number;
}

export interface AttendanceAnalyticsBundle {
  overview:         SafeResult<AttendanceOverviewExt>;
  bySession:        SafeResult<SessionAttendanceRow[]>;
  ranking:          SafeResult<MemberAttendanceRanking[]>;
  trend:            SafeResult<AttendanceTrend>;
  zoneDistribution: SafeResult<AttendanceZoneDistribution>;
  absentees:        SafeResult<AttendanceAbsenteeList>;
}

export async function fetchAttendanceAnalyticsBundle(f: AttendanceFiltersDTO): Promise<AttendanceAnalyticsBundle>;
export async function fetchAttendanceSessionDetail(sessionId: string): Promise<SafeResult<AttendanceSessionDetail>>;
export function buildAttendanceExportUrl(f: AttendanceFiltersDTO): string;   // <a download> 用
```

- **FB-SDK-07-1**: 既存 `safeServerFetch` を再利用。新たな fetch wrapper を作らない。
- **エラーハンドリング**: 各エンドポイント独立に `SafeResult` を返し、partial failure を上位の `AttendanceAnalyticsPage` が `AdminSectionError` で degrade（page error.tsx へ throw しない）。
- **副作用**: Server Component から呼ぶ前提（`'server-only'` import を先頭に）。

### B-8. UI コンポーネント

| component | 主要 props | 責務 |
|---|---|---|
| `AttendanceAnalyticsPage` (server) | `{ searchParams }` | filter parse → `fetchAttendanceAnalyticsBundle` → 子へ pass。Suspense なし（force-dynamic）。 |
| `KpiPanel` (server) | `{ overview }` | 4 枚 KPI を `--ubm-*` token で描画。 |
| `AttendancePeriodFilter` (client) | `{ value, onChange }` | Segmented (今月/3M/6M/1Y/All)。`useAttendanceFilters` 経由で URL query 更新。 |
| `AttendanceZoneFilter` (client) | `{ value, onChange }` | Checkbox 3 個 (0→1 / 1→10 / 10→100)。 |
| `AttendanceTrendChart` (client) | `{ trend }` | Recharts LineChart。1 系列。 |
| `AttendanceZoneDistributionChart` (client) | `{ rows }` | Recharts 積上げ BarChart。 |
| `SessionAttendanceTable` (client) | `{ rows, onRowClick }` | sort 可。行クリックで Drilldown Modal open。 |
| `MemberAttendanceTable` (client) | `{ rows }` | 出席率 / 連続参加 / 最終出席日列。 |
| `AttendanceTop10Ranking` (server) | `{ rows }` | Chip + 横棒。 |
| `AttendanceAbsenteeAlert` (server) | `{ data }` | 折り畳み可能 list。 |
| `AttendanceDrilldownModal` (client) | `{ sessionId, onClose }` | 開いたら `fetchAttendanceSessionDetail` を client fetch。 |
| `AttendanceExportButton` (client) | `{ filters }` | `<a href={buildAttendanceExportUrl(...)} download>` でブラウザ DL。 |
| `useAttendanceFilters` (hook) | — | `useSearchParams` / `useRouter` で URL ↔ state 同期。 |
| `format-attendance.ts` | — | `formatRate(0.123) → '12.3%'` / `formatPeriod` 等の純関数。 |

- **Design Token**: 全 component で `var(--ubm-color-*)` のみ。HEX 禁止。
- **Recharts node-only?**: `recharts` は browser 互換 → client component OK。`force-dynamic` page 内で SSR 回避済。
- **a11y**: Modal は focus trap + Esc close、`role="dialog"`。

### B-9. page.tsx 差し替え

```tsx
// apps/web/app/(admin)/admin/dashboard/attendance/page.tsx
import 'server-only';
import { AttendanceAnalyticsPage } from '@/features/admin/attendance/components/AttendanceAnalyticsPage';
export const dynamic = 'force-dynamic';
export default function Page({ searchParams }: { searchParams: Record<string,string|string[]|undefined> }) {
  return <AttendanceAnalyticsPage searchParams={searchParams} />;
}
```

旧 145 行は削除して**新ページへ完全委譲**。Sidebar route は不変。

### B-10. 正本仕様更新

`docs/00-getting-started-manual/specs/01-api-schema.md:184-214` を編集:
- 既存 3 endpoint の query に `periodFrom/periodTo/zone` を追加。
- 新規 5 endpoint を request/response Zod 付きで列挙。
- 「不正値は clamp / fallback、400 を返さない」原則を再掲。

---

## C. 重要な実装パターン明示

### C-1. `safeServerFetch<T>` の使い方（FB-SDK-07-1）

```ts
const res = await safeServerFetch<AttendanceTrend>(
  buildInternalUrl('/admin/dashboard/attendance/trend', queryRecord),
  { schema: AttendanceTrendZ, label: 'attendance.trend' },
);
// res: SafeResult<AttendanceTrend> = T | { __error: true, code, message, status }
```

新規 fetch wrapper を作らない。`SafeResult` を上位コンポーネントが `isSafeError(res)` で分岐。

### C-2. `safe-fetch.ts` の error code 規約

| HTTP | code |
|---|---|
| 400 | `ADMIN_FETCH_400` |
| 401 | `ADMIN_FETCH_401` |
| 403 | `ADMIN_FETCH_403` |
| 404 | `ADMIN_FETCH_404` |
| 500 | `ADMIN_FETCH_500` |
| network/timeout | `ADMIN_FETCH_NETWORK` |
| zod parse 失敗 | `ADMIN_FETCH_SCHEMA` |

`AdminSectionErrorClient` がこの code で i18n message を引く。

### C-3. limit/period/zone clamp（400 不可）

```ts
function clampInt(raw: string|undefined, def: number, min: number, max: number): number {
  const n = Number(raw); if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}
function parseIsoDateOrNull(raw: string|undefined): string|null {
  if (!raw) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}
function parseZones(raw: string|undefined): AttendanceZone[]|null {
  if (!raw) return null;
  const set = new Set<AttendanceZone>();
  for (const z of raw.split(',')) if (AttendanceZoneZ.safeParse(z).success) set.add(z as AttendanceZone);
  return set.size ? [...set] : null;
}
```

### C-4. D1 SQL の half-open interval

```sql
-- periodFrom inclusive, periodTo exclusive
AND meeting_sessions.held_on >= :periodFrom
AND meeting_sessions.held_on <  :periodTo
```

文字列比較で OK（`held_on` は ISO date `YYYY-MM-DD` 格納前提）。`null` フィルタは該当条件を SQL から省略（dynamic clause builder で空文字列にする）。

### C-5. `null` zone 正規化

```sql
CASE
  WHEN m.attendance_count IS NULL OR m.attendance_count = 0 THEN '0→1'   -- 仕様再確認: 未出席は '0→1' 区画
  WHEN m.attendance_count BETWEEN 1 AND 9   THEN '1→10'
  WHEN m.attendance_count BETWEEN 10 AND 99 THEN '10→100'
  ELSE 'unknown'
END AS zone
```

zone-distribution の集計で `NULL` グループが出た場合は `'unknown'` に正規化してから返す。

### C-6. ranking sort

```sql
ORDER BY attended_count DESC, member_id ASC
```

`member_id ASC` で tie-break して deterministic 化（snapshot test 安定化）。

### C-7. CSV (`apps/api/src/lib/csv-export.ts`)

- **ヘッダ行**: `session_id,title,held_on,member_id,display_name,zone,attended`
- **改行**: CRLF (`\r\n`) — Excel 互換
- **BOM**: 先頭に `﻿` を**付与する**（Excel 日本語文字化け回避）
- **エスケープ**: 値に `,` / `"` / 改行 を含む場合は `"` で囲み、内部 `"` は `""` に二重化
- **Content-Type**: `text/csv; charset=utf-8`
- **Content-Disposition**: `attachment; filename="attendance-${periodFrom}_${periodTo}.csv"`
- **stream**: 大量行対策で `ReadableStream` でチャンク送出（Workers の `c.body(stream)` 経由）

---

## D. Pitfall 回避

| ID | 回避策 |
|----|--------|
| **FB VSCPKR-01** (esbuild JSDoc `*/`) | JSDoc コメント内に `*/` を直書きしない。例: `'**/foo'` のような glob は文字列リテラルで分割するか `*\/` でエスケープ。 |
| **FB W1-02b-4** (node-only in renderer) | `recharts` は OK だが `fs` / `path` / `node:*` を**client / Workers では import しない**。CSV stream も `Web Streams API` のみ使用、Node `stream` 不使用。 |
| **FB W0-01** (root barrel 衝突) | `packages/shared/src/index.ts` には**追加しない**。必ず `@repo/shared/zod/admin-attendance` / `@repo/shared/types/admin-attendance` の subpath で import。 |
| **IPC/Preload 該当なし** | 本タスクは Web (Next.js) + API (Workers) のみ。Electron / preload / IPC bridge は**対象外**（明記）。 |
| **FB-CANCEL-004** (partial fix) | A の step 6 (route 登録) と step 9 (page 差し替え) を**必ず**完了。実装あっても consumer 未配線は「完了扱い禁止」。 |
| **FB-UI-02-1** (削除 vs stub) | **G 節参照**。本 Phase は削除ファイルなし。 |

---

## E. ローカル実行・検証コマンド

shared-context §8 を step ごとに展開:

```bash
# step 2-3 (shared)
pnpm --filter @repo/shared build
pnpm --filter @repo/shared test

# step 4 (repo)
pnpm --filter @ubm-hyogo/api test -- attendance-analytics
pnpm --filter @ubm-hyogo/api lint

# step 5-6 (API routes)
pnpm --filter @ubm-hyogo/api test -- routes/admin
pnpm --filter @ubm-hyogo/api build
# 手動 smoke
pnpm --filter @ubm-hyogo/api dev   # 別ターミナルで
curl -H "x-internal-auth: $UBM_INTERNAL_AUTH" \
  'http://127.0.0.1:8787/admin/dashboard/attendance/overview?periodFrom=2026-01-01&periodTo=2026-06-01&zone=1→10,10→100'

# step 7 (web fetch)
pnpm --filter @ubm-hyogo/web test -- fetch-attendance

# step 8 (UI)
pnpm --filter @ubm-hyogo/web test -- AttendanceAnalyticsPage
pnpm --filter @ubm-hyogo/web test -- AttendanceTrendChart
pnpm --filter @ubm-hyogo/web test -- SessionAttendanceTable
pnpm --filter @ubm-hyogo/web test -- AttendanceDrilldownModal
pnpm --filter @ubm-hyogo/web test -- useAttendanceFilters

# step 9 (page diff)
pnpm --filter @ubm-hyogo/web build
pnpm --filter @ubm-hyogo/web dev   # http://localhost:3000/admin/dashboard/attendance を目視

# step 10 後・最終
pnpm --filter @ubm-hyogo/web playwright test admin-attendance
pnpm -w lint && pnpm -w build && pnpm -w test
```

---

## F. DoD（Phase 5 完了条件 — タスク粒度チェック）

shared-context §9 を Phase 5 視点で全項目チェック化:

- [ ] **404 解消**: staging で `/admin/dashboard/attendance` が 200 を返し、旧/新 UI どちらでも描画される（step 1 完了）。
- [ ] **新 UI 表示**: KPI 4 枚 / 期間 Segmented / 区画 Checkbox / トレンド線 / 区画分布棒 / セッション表 / メンバー表 / TOP10 / 欠席アラート / Drilldown Modal / CSV ボタン が**全て**表示・操作可能。
- [ ] **Phase 4 RED 全 GREEN**: `attendance-analytics.contract.spec.ts` / `attendance-analytics.spec.ts` / `AttendanceAnalyticsPage.spec.tsx` / `AttendanceTrendChart.spec.tsx` / `SessionAttendanceTable.spec.tsx` / `AttendanceDrilldownModal.spec.tsx` / `useAttendanceFilters.spec.ts` / Playwright `admin-attendance.spec.ts`。
- [ ] **正本仕様反映**: `01-api-schema.md:184-214` が新規 5 + 拡張 3 endpoint を網羅、Zod 型と diff なし。
- [ ] **monorepo 通し**: `pnpm -w lint && pnpm -w build && pnpm -w test` 全グリーン。
- [ ] **CONST_005 全項目**: shared-context §4 チェックリスト全 ✔。
  - [ ] API base path 不変 / [ ] limit clamp / [ ] D1 直接参照なし / [ ] `safeServerFetch` 経由 / [ ] partial degrade / [ ] Sidebar route 不変 / [ ] `--ubm-*` token のみ / [ ] subpath export / [ ] active filter / [ ] sort 規約 / [ ] Admin 二段防御 / [ ] audit 不要 (read-only)。
- [ ] **Pitfall 5 件回避**: D 節を PR description self-review 欄でチェック。
- [ ] **partial fix 防止**: step 6 (index.ts) + step 9 (page.tsx) が**コミット済**であることを `git log` で確認。
- [ ] **実機確認**: ローカル dev で全画面を操作し、CSV を Excel で開いて文字化けなしを確認。
- [ ] **Phase 11 への引き継ぎ材料**: スクショ / 画面録画 / curl ログを `artifacts/phase-5/` に格納。

---

## G. 「ファイル削除」vs「stub 化」判定（FB-UI-02-1）

**本 Phase 5 の判定: 削除ファイルなし。全て新規 + 編集のみ。**

| 候補 | 判定 | 理由 |
|---|---|---|
| `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` の旧実装 | **編集 (全文置換)** | ファイル自体は Next.js のルートとして残す必要がある。中身を新 `AttendanceAnalyticsPage` 委譲のみに置き換え。 |
| 既存 `repository/attendance.ts` の旧 3 関数 | **編集 (シグネチャ拡張) or 残置** | 他から呼ばれていれば残し、analytics.ts から re-export。誰も呼んでいなくても**stub として残置**（将来の rollback 容易性）。 |
| 既存 `routes/admin/dashboard.ts` の出席部分 | **編集** | 既存 endpoint パスを保ち query を追加するため削除不可。 |
| fixture (`server-fetch.ts`) | **編集 (env guard 強化)** | staging で誤動作する場合のみ guard を強化。削除はしない（local dev で使う可能性）。 |

→ 全件「編集 or 新規」で完結し、`git rm` 対象なし。これを PR description に明記する。

---

## 実装ログ（PR description に転記する欄）

- 404 原因: **(step 1 で確定し記入)**
- 対処: **(同上)**
- 削除ファイル: **なし**
- 新規ファイル数: 22 (UI 12 + hook 1 + format 1 + web fetch 1 + api route 5 + api lib 1 + repo 1)
- 編集ファイル数: 6 (page.tsx / dashboard.ts / attendance.ts / index.ts / viewmodel.ts / 01-api-schema.md)
- partial fix チェック: step 6 ✔ / step 9 ✔

# 共有コンテキスト（各 Phase 仕様書 SubAgent が参照）

> このファイルは作業中の SSOT。仕様書本体は `phase-N.md`。本ファイルは Phase 12 完了時に `archive/` 移動可。

## 1. 現状実装（調査済み）

### Web
- ページ: `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` (L1-145)
  - Server Component (`force-dynamic`)
  - `Promise.all` で overview / by-session / ranking を並列フェッチ
  - エラー時は `AdminSectionErrorClient` で `code/message` 表示
- ナビ: `apps/web/src/components/layout/AdminSidebar.tsx:7` に「出席分析」リンク
- データフェッチ: `apps/web/src/lib/admin/safe-server-fetch.ts` (`safeServerFetch<T>` → `SafeResult<T | SafeResultError>`)
- 内部 proxy: `apps/web/src/lib/admin/server-fetch.ts` (`INTERNAL_API_BASE_URL` + `x-internal-auth`)
- エラー正規化: `apps/web/src/lib/server-fetch/safe-fetch.ts:20-35` (`ADMIN_FETCH_[STATUS]`)

### API
- ルート登録: `apps/api/src/index.ts:15,37-38`
- 出席エンドポイント: `apps/api/src/routes/admin/dashboard.ts:88-122`
  - `GET /admin/dashboard/attendance/overview`
  - `GET /admin/dashboard/attendance/by-session?limit=`
  - `GET /admin/dashboard/attendance/ranking?limit=`
  - `requireAdmin` ミドルウェア (L46) で JWT `isAdmin` claim 検証
  - limit: 1〜200 clamp (L33-39)
- 集計関数: `apps/api/src/repository/attendance.ts`
  - `computeAttendanceOverview` (L455-487)
  - `listSessionAttendanceStats` (L489-528)
  - `listMemberAttendanceRanking` (L530-563)

### DB
- `apps/api/migrations/0002_admin_managed.sql:17-31`
  - `meeting_sessions(session_id PK, title, held_on, note, created_at, created_by)`
  - `member_attendance(member_id, session_id, assigned_at, assigned_by, PK(member_id, session_id))`

### 認可
- API: `apps/api/src/middleware/require-admin.ts:116-148` (HS256 JWT + `AUTH_SECRET`)
- Web: `apps/web/middleware.ts` で `/admin/:path*` 保護

### 型
- `packages/shared/src/zod/viewmodel.ts`
  - `AttendanceOverviewZ` / `SessionAttendanceRowZ` / `MemberAttendanceRankingZ` (strict)

### テスト
- Contract: `apps/api/src/routes/admin/dashboard.contract.spec.ts` (`@vitest-environment node`, `setupD1()`)
- Web vitest: `apps/web/src/lib/admin/__tests__/safe-server-fetch.spec.ts`
- Playwright: `apps/web/playwright/tests/visual/admin-dashboard.spec.ts`

## 2. 404 原因仮説（Phase 5 で確定）

優先度順:
1. staging の D1 に `meeting_sessions` / `member_attendance` データが0件で SQL は成功するが返却データが想定外パスを通る
2. `INTERNAL_API_BASE_URL` が staging で未設定 / 誤設定 → fetch URL が 404 になる
3. `apps/web/src/lib/admin/server-fetch.ts` 内の fixture（task18_smoke 等）が staging 環境で本フロー fall-through している
4. Workers staging deployment にルート登録漏れ（unlikely: index.ts に登録あり）
5. `x-internal-auth` トークン未設定で 401 → エラーパス分岐ミスで 404 化

## 3. プロトタイプ準拠の機能仕様（Full モード）

### 画面構成（新 `AttendanceAnalyticsPage`）

```
1. PageHeader: タイトル + 期間フィルタ(Segmented: 今月/3M/6M/1Y/All) + 区画フィルタ(Checkbox: 0→1 / 1→10 / 10→100) + CSV エクスポートボタン
2. KPIPanel (.grid-4):
   - 全体出席率 (%)
   - 総出席者数 (期間内 unique members)
   - 平均出席数 (per session)
   - トレンド (前期間比 ↑/↓ ratio)
3. ChartSection (.grid-2):
   - 出席トレンド (折れ線, 月別)
   - 区画別出席分布 (積上げ棒)
4. SessionTable: セッション別出席状況（既存 by-session 拡張、ソート可、行クリックで Drilldown Modal）
5. MemberTable: メンバー別出席率（既存 ranking 拡張、出席率/連続参加/最終出席 列追加）
6. Top10Ranking: 出席頻度 TOP 10 (Chip + bar)
7. AbsenteeAlert: 直近 N セッション欠席メンバー (要フォローアップ)
8. DrilldownModal: セッション選択 → 出席メンバー / 欠席メンバー一覧
```

### 新規 / 拡張 API

| Method | Path | 用途 | 状態 |
| ------ | ---- | ---- | ---- |
| GET | `/admin/dashboard/attendance/overview?periodFrom&periodTo&zone` | 期間+区画フィルタ拡張 | 既存拡張 |
| GET | `/admin/dashboard/attendance/by-session?limit&periodFrom&periodTo&zone` | 期間+区画 | 既存拡張 |
| GET | `/admin/dashboard/attendance/ranking?limit&periodFrom&periodTo&zone` | 期間+区画 | 既存拡張 |
| GET | `/admin/dashboard/attendance/trend?periodFrom&periodTo&granularity=month` | 新規（時系列推移） | 新規 |
| GET | `/admin/dashboard/attendance/zone-distribution?periodFrom&periodTo` | 新規（区画別積上げ） | 新規 |
| GET | `/admin/dashboard/attendance/sessions/:sessionId/attendees` | 新規（Drilldown） | 新規 |
| GET | `/admin/dashboard/attendance/absentees?lastN=3&periodFrom&periodTo&zone` | 新規（要フォローアップ） | 新規 |
| GET | `/admin/dashboard/attendance/export?periodFrom&periodTo&zone&format=csv` | 新規 CSV エクスポート | 新規 |

### 新規 Zod スキーマ（`packages/shared/src/zod/viewmodel.ts` 追記）

```ts
AttendanceTrendBucketZ = { period: string; attendeeCount: number; sessionCount: number; uniqueMemberCount: number }.strict()
AttendanceTrendZ = { granularity: 'month'; buckets: AttendanceTrendBucketZ[] }.strict()

AttendanceZoneDistributionRowZ = { zone: '0→1'|'1→10'|'10→100'|'unknown'; attendeeCount: number; rate: number }.strict()

AttendanceSessionDetailZ = { sessionId, title, heldOn, attendees: { memberId, displayName, zone }[], absentees: { memberId, displayName, zone }[] }.strict()

AttendanceAbsenteeZ = { memberId, displayName, zone, lastAttendedAt|null, missedCount: number }.strict()

// overview 拡張（既存）
AttendanceOverviewZ に periodFrom/periodTo/zoneFilter エコーバック + previousPeriodRate を追加
```

### URL クエリ規約
- `periodFrom` / `periodTo`: `YYYY-MM-DD`（半開区間 [from, to)）
- `zone`: カンマ区切り (`zone=0→1,1→10`)、未指定は全 zone
- 不正値は 400 を返さず default fallback (clamp)。`01-api-schema.md:186-194`に準拠

## 4. 正本仕様遵守チェックリスト

- [ ] API 命名は `/admin/dashboard/attendance/*` のみで拡張、新ベースパス追加禁止
- [ ] limit は clamp / default fallback（400 不可）
- [ ] D1 直接参照禁止（apps/web は `/api/admin/*` proxy 経由）
- [ ] `safeServerFetch<T>()` で `SafeResult<T | SafeResultError>` 正規化
- [ ] partial failure は `AdminSectionError` で degrade、page error.tsx へ throw しない
- [ ] Sidebar route `/(admin)/admin/dashboard/attendance` を変更しない
- [ ] Design Token: `--ubm-*` のみ、HEX 直書き禁止
- [ ] 型は `packages/shared` 配置、`subpath export` で衝突回避（`@repo/shared/types/admin-attendance` 等）
- [ ] 集計分母: `deleted_at IS NULL` / `is_deleted != 1` の active のみ
- [ ] Sort 不変: `held_on DESC, session_id DESC`
- [ ] Admin gate 二段防御維持（UI middleware + API requireAdmin）
- [ ] Audit log: 既存攻撃面のみ。本タスクは read-only API のため audit 不要

## 5. 既存命名規則

- TS 識別子: camelCase（`safeServerFetch`, `fetchAdmin`）
- Component: PascalCase（`AdminSectionCard`, `AttendanceAnalyticsPage`）
- ファイル名: kebab-case（`safe-server-fetch.ts`）/ Next.js page は `page.tsx`
- API パス: kebab-case + RESTful
- Zod: `XxxZ` suffix
- error code: `ADMIN_FETCH_[STATUS]`
- env var: SCREAMING_SNAKE
- Test file: `*.spec.ts` / `*.spec.tsx`

## 6. 変更対象ファイル一覧（Phase 5 で使用）

### 新規作成
- `apps/web/src/features/admin/attendance/components/AttendanceAnalyticsPage.tsx`
- `apps/web/src/features/admin/attendance/components/KpiPanel.tsx`
- `apps/web/src/features/admin/attendance/components/AttendancePeriodFilter.tsx`
- `apps/web/src/features/admin/attendance/components/AttendanceZoneFilter.tsx`
- `apps/web/src/features/admin/attendance/components/AttendanceTrendChart.tsx`
- `apps/web/src/features/admin/attendance/components/AttendanceZoneDistributionChart.tsx`
- `apps/web/src/features/admin/attendance/components/SessionAttendanceTable.tsx`
- `apps/web/src/features/admin/attendance/components/MemberAttendanceTable.tsx`
- `apps/web/src/features/admin/attendance/components/AttendanceTop10Ranking.tsx`
- `apps/web/src/features/admin/attendance/components/AttendanceAbsenteeAlert.tsx`
- `apps/web/src/features/admin/attendance/components/AttendanceDrilldownModal.tsx`
- `apps/web/src/features/admin/attendance/components/AttendanceExportButton.tsx`
- `apps/web/src/features/admin/attendance/hooks/useAttendanceFilters.ts`
- `apps/web/src/features/admin/attendance/lib/format-attendance.ts`
- `apps/web/src/lib/admin/fetch-attendance.ts` (server-side aggregation)
- `apps/api/src/routes/admin/attendance-trend.ts` (or 追記)
- `apps/api/src/routes/admin/attendance-zone-distribution.ts`
- `apps/api/src/routes/admin/attendance-session-detail.ts`
- `apps/api/src/routes/admin/attendance-absentees.ts`
- `apps/api/src/routes/admin/attendance-export.ts`
- `apps/api/src/repository/attendance-analytics.ts` (拡張集計関数)
- `apps/api/src/lib/csv-export.ts` (CSV 共通)
- `packages/shared/src/zod/admin-attendance.ts` (新規拡張 schemas)
- `packages/shared/src/types/admin-attendance.ts` (TS 型 re-export)
- 各テストファイル（後述）

### 編集
- `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` (root → 新 AttendanceAnalyticsPage へ委譲)
- `apps/api/src/routes/admin/dashboard.ts:88-122` (期間/zone クエリ追加)
- `apps/api/src/repository/attendance.ts:455-563` (period/zone 引数追加 or 新 analytics.ts へ抽出)
- `apps/api/src/index.ts` (新ルート登録)
- `packages/shared/src/zod/viewmodel.ts` (既存スキーマ拡張)
- `docs/00-getting-started-manual/specs/01-api-schema.md:184-214` (正本仕様更新)
- `apps/web/src/lib/admin/server-fetch.ts` (fixture 切替確認 / 404 原因が fixture の場合)

## 7. テストファイル（Phase 4 で作成）

- `apps/api/src/routes/admin/__tests__/attendance-analytics.contract.spec.ts`
- `apps/api/src/repository/__tests__/attendance-analytics.spec.ts`
- `apps/web/src/features/admin/attendance/__tests__/AttendanceAnalyticsPage.spec.tsx`
- `apps/web/src/features/admin/attendance/__tests__/AttendanceTrendChart.spec.tsx`
- `apps/web/src/features/admin/attendance/__tests__/SessionAttendanceTable.spec.tsx`
- `apps/web/src/features/admin/attendance/__tests__/AttendanceDrilldownModal.spec.tsx`
- `apps/web/src/features/admin/attendance/__tests__/useAttendanceFilters.spec.ts`
- `apps/web/playwright/tests/visual/admin-attendance.spec.ts`

## 8. ローカル実行コマンド（各 Phase で参照）

```bash
# API
pnpm --filter @ubm-hyogo/api lint
pnpm --filter @ubm-hyogo/api build
pnpm --filter @ubm-hyogo/api test
pnpm --filter @ubm-hyogo/api test -- attendance-analytics

# Web
pnpm --filter @ubm-hyogo/web lint
pnpm --filter @ubm-hyogo/web build
pnpm --filter @ubm-hyogo/web test
pnpm --filter @ubm-hyogo/web test -- AttendanceAnalyticsPage

# Playwright visual
pnpm --filter @ubm-hyogo/web playwright test admin-attendance

# 全部
pnpm -w lint && pnpm -w build && pnpm -w test
```

## 9. DoD（最終受入条件）

1. staging で `/admin/dashboard/attendance` ページが 404 なしで表示される
2. KPI 4枚 / 期間フィルタ / 区画フィルタ / トレンドグラフ / セッションテーブル / メンバーテーブル / TOP10 / ドリルダウンモーダル / 欠席アラート / CSV エクスポート が動作する
3. 全 contract / vitest / Playwright がグリーン
4. `01-api-schema.md` に新規/拡張エンドポイントが反映され、Zod 型と一致
5. `pnpm -w lint && pnpm -w build && pnpm -w test` グリーン
6. ユーザーへの実機確認動画/スクショ送付完了（VISUAL Phase 11）
7. PR description が変更点を網羅

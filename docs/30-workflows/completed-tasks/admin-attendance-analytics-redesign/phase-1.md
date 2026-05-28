[実装区分: 実装仕様書]
implementation_mode: new
task_classification: UI task (VISUAL)

# Phase 1: 要件定義

## メタ情報

- **task_id**: `admin-attendance-analytics-redesign`
- **phase**: 1 / 13
- **phase_name**: 要件定義
- **created_date**: 2026-05-26
- **classification**: UI task (VISUAL)
- **implementation_mode**: new
- **CONST**: CONST_004 (実装仕様書) / CONST_005 (必須項目)
- **chain_position**: 1/1 （単独タスク、chain なし）
- **upstream**: プロトタイプ正本 + 現状実装調査済み（`_shared-context.md`）
- **downstream**: Phase 2（設計）/ Phase 4（テスト）/ Phase 5（実装）

## 目的

Admin 出席分析ページ (`/admin/dashboard/attendance`) の UI/UX を全面刷新し、staging で発生している 404 を解消した上で、プロトタイプ準拠の KPI / 期間フィルタ / 区画フィルタ / トレンドグラフ / セッションテーブル / メンバーテーブル / TOP10 / 欠席アラート / Drilldown モーダル / CSV エクスポートを完成させるための **要件確定** を行う。Phase 2 以降が参照する単一の真実源（受入条件 AC-1〜AC-N、スコープ境界、既存インベントリ、命名規則固定）を作る。

---

## P50 前提確認チェック（実行タスク Step 0：必須）

Phase 2 着手前に以下を確認し、結果を `outputs/phase-1/p50-precheck.md` に記録する。

### 1. ブランチ / upstream 整合

- [ ] `git rev-parse --abbrev-ref HEAD` が `dev`（または本タスク用 feature branch）であること
- [ ] `git log -1 --oneline` が `7f651a083 feat(issue-908): staging rollback notification...` 以降にあること
- [ ] `git fetch origin && git log HEAD..origin/main --oneline` で main 取り込み未済の差分が 0 であること
- [ ] 作業ツリーが clean（`git status` で本仕様書以外の差分なし）

### 2. 前提タスク完了確認

- [ ] プロトタイプ正本仕様抽出 完了（`_shared-context.md §3` に反映済み）
- [ ] 現状 Admin 出席分析実装 調査完了（`_shared-context.md §1, §6` に反映済み）
- [ ] 関連 system specs（`docs/00-getting-started-manual/specs/01-api-schema.md:184-214` 等）読み込み済み

### 3. 環境前提

- [ ] Node 22 系 / pnpm 9.x（`package.json` `engines` 準拠）
- [ ] Workers staging deployment に `INTERNAL_API_BASE_URL` / `x-internal-auth` secret が設定可能（404 原因仮説 H2/H5 検証用）
- [ ] D1 staging に `meeting_sessions` / `member_attendance` migration 0002 が適用済み

**P50 失敗時の戻り先**: 失敗項目を Phase 0（プロジェクト準備）相当に戻し、本 Phase は再開不可。

---

## タスク分類

- **classification**: **UI task (VISUAL)**
- 根拠:
  - 新規 React コンポーネント 12 本（`_shared-context.md §6 新規作成`）
  - Chart 系（折れ線・積上げ棒）と Modal の追加で **視覚的差分が支配的**
  - Playwright visual spec (`admin-attendance.spec.ts`) を Phase 4 で新規追加し Phase 9 で snapshot 更新
  - DoD #6 に「ユーザーへの実機確認動画/スクショ送付完了」が含まれる（VISUAL Phase 11 要件）
- **docs-only task ではない**理由: API 5 新規 / 3 既存拡張 + DB 集計 SQL 追加を伴う full-stack 改修。

---

## スコープ

### 含む（IN）

1. **Web UI 全面刷新** — `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` を新 `AttendanceAnalyticsPage` へ委譲、`_shared-context.md §3` の 8 領域（PageHeader / KPIPanel / ChartSection / SessionTable / MemberTable / Top10Ranking / AbsenteeAlert / DrilldownModal）を実装
2. **API 拡張 + 新規** — 既存 3 endpoint に `periodFrom` / `periodTo` / `zone` クエリ追加 + 新規 5 endpoint（trend / zone-distribution / sessions/:id/attendees / absentees / export）
3. **Repository 拡張** — `apps/api/src/repository/attendance.ts` の集計関数に period / zone 引数追加、または `attendance-analytics.ts` へ抽出
4. **Zod スキーマ追加** — `packages/shared/src/zod/viewmodel.ts` 既存拡張 + `packages/shared/src/zod/admin-attendance.ts` 新設（trend / zone-distribution / session-detail / absentee）
5. **CSV エクスポート** — `apps/api/src/lib/csv-export.ts` 共通化 + `attendance-export.ts` ルート
6. **404 原因の特定と解消** — `_shared-context.md §2` の 5 仮説を Phase 5/9 で順次検証
7. **テスト** — contract / vitest（web/api）/ Playwright visual を `_shared-context.md §7` に従い追加
8. **正本仕様更新** — `docs/00-getting-started-manual/specs/01-api-schema.md:184-214` に新規 / 拡張 endpoint を追記

### 含まない（OUT）

- 出席登録（mutation）系の改修（既存 `MeetingPanel.tsx` の `/api/admin/meetings/.../attendances` POST は触らない）
- メンバー / セッション CRUD 画面の刷新
- Sidebar route 変更（`/admin/dashboard/attendance` 維持）
- 認可方式変更（HS256 JWT + `requireAdmin` 継続）
- D1 schema migration 追加（既存 `meeting_sessions` / `member_attendance` のみで完結）
- Audit log 追加（read-only API のため）
- 通知（Slack / メール）統合
- i18n（日本語固定で OK）

---

## 受入条件（DoD = `_shared-context.md §9` を AC 化）

| ID | 条件 | 検証方法 |
| --- | --- | --- |
| AC-1 | staging `/admin/dashboard/attendance` が 404 なく 200 で表示される | 手動ブラウザ確認 + Playwright visual |
| AC-2 | KPI 4 枚（全体出席率 / 総出席者 / 平均出席 / 前期間比トレンド）が `_shared-context.md §3` の数値定義どおり描画 | vitest + Playwright |
| AC-3 | 期間フィルタ Segmented（今月/3M/6M/1Y/All）切替で全セクションが再フェッチされる | vitest + Playwright |
| AC-4 | 区画フィルタ Checkbox（0→1 / 1→10 / 10→100）の AND 絞り込みが全セクションに反映 | vitest |
| AC-5 | トレンドグラフ（月別折れ線）と区画別出席分布（積上げ棒）が `AttendanceTrendZ` / `AttendanceZoneDistributionRowZ` 準拠で描画 | vitest |
| AC-6 | SessionTable の行クリックで Drilldown Modal が開き出席者 / 欠席者一覧を表示 | vitest + Playwright |
| AC-7 | MemberTable に出席率 / 連続参加 / 最終出席 列が追加され、ソート可 | vitest |
| AC-8 | Top10Ranking と AbsenteeAlert（直近 N 欠席）が描画 | vitest |
| AC-9 | CSV エクスポートボタン押下で `attendance-export?format=csv` を呼び、ダウンロードが成功 | Playwright |
| AC-10 | 既存 contract / vitest / Playwright 全てグリーン + 新規追加分グリーン | `pnpm -w test` |
| AC-11 | `01-api-schema.md` に新規 5 + 拡張 3 endpoint が記載され Zod 型と一致 | doc grep + Zod parse |
| AC-12 | `pnpm -w lint && pnpm -w build && pnpm -w test` グリーン | CI |
| AC-13 | VISUAL Phase 11: 実機確認スクショ / 動画をユーザーへ送付完了 | Phase 11 成果物 |
| AC-14 | PR description に変更点・404 原因・新規 endpoint 一覧・before/after スクショを網羅 | Phase 12 成果物 |
| AC-15 | API limit は 1〜200 clamp、不正値は 400 ではなく default fallback（既存規約遵守） | contract spec |
| AC-16 | Design Token `--ubm-*` のみ使用、HEX 直書きゼロ | lint + grep |

---

## 既存コードベースのインベントリ

`_shared-context.md §1, §6` をベースに、追加 grep / Read で網羅化。

### Web ページ / コンポーネント / インフラ

| ファイル | 目的 |
| --- | --- |
| `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` (L1-145) | 現行 Server Component（`force-dynamic`）。`Promise.all` で overview/by-session/ranking を並列フェッチ。**本 Phase で新 AttendanceAnalyticsPage へ委譲する Edit 対象** |
| `apps/web/src/components/layout/AdminSidebar.tsx:7` | 「出席分析」リンク。**変更禁止**（route 不変） |
| `apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx:21` | Sidebar route 不変の回帰テスト基準 |
| `apps/web/src/lib/admin/safe-server-fetch.ts` | `safeServerFetch<T>()` SSR 用 fetcher。**全新規 fetch はこれを経由** |
| `apps/web/src/lib/admin/server-fetch.ts` (L267 周辺) | 内部 proxy + fixture（`task18_smoke`）。**404 原因仮説 H3 の検証対象** |
| `apps/web/src/lib/admin/api.ts:557,563` | mutation 用 `/meetings/.../attendances` POST。**本タスク out-of-scope（変更禁止）** |
| `apps/web/src/lib/server-fetch/safe-fetch.ts:20-35` | error code `ADMIN_FETCH_[STATUS]` 正規化。**継続利用** |
| `apps/web/src/features/admin/components/_shared/AdminSectionCard.tsx` | セクション枠 UI（タイトル + body）。**新 KPI / Chart セクションでも継続利用** |
| `apps/web/src/features/admin/components/_shared/AdminSectionError.tsx` | partial failure 描画。**新セクションでも degrade UI として利用** |
| `apps/web/src/features/admin/components/_shared/AdminSectionErrorClient.tsx` | Client Component 版エラー描画 |
| `apps/web/src/features/admin/components/_shared/index.ts` | barrel export。新セクションも追記 |
| `apps/web/middleware.ts` | `/admin/:path*` 保護（Admin gate UI 側）。**変更禁止** |
| `apps/web/src/components/admin/MeetingPanel.tsx` | 既存 attendance mutation 画面。**変更禁止（参照のみ）** |

### Web 新規作成（Phase 5 で実装）

`_shared-context.md §6 新規作成` から再掲。

- `apps/web/src/features/admin/attendance/components/AttendanceAnalyticsPage.tsx` — ルート（Server Component）
- `apps/web/src/features/admin/attendance/components/{KpiPanel,AttendancePeriodFilter,AttendanceZoneFilter,AttendanceTrendChart,AttendanceZoneDistributionChart,SessionAttendanceTable,MemberAttendanceTable,AttendanceTop10Ranking,AttendanceAbsenteeAlert,AttendanceDrilldownModal,AttendanceExportButton}.tsx`
- `apps/web/src/features/admin/attendance/hooks/useAttendanceFilters.ts` — URL クエリ ↔ filter state 同期
- `apps/web/src/features/admin/attendance/lib/format-attendance.ts` — 数値/日付フォーマッタ
- `apps/web/src/lib/admin/fetch-attendance.ts` — 全 endpoint の SSR fetch を集約

### API ルート / リポジトリ

| ファイル | 目的 |
| --- | --- |
| `apps/api/src/index.ts:15,37-38` | route 登録。**新 5 endpoint を追記する Edit 対象** |
| `apps/api/src/routes/admin/dashboard.ts:88-122` | 既存 3 endpoint 定義。**period/zone 追加で Edit** |
| `apps/api/src/routes/admin/dashboard.contract.spec.ts` | 既存 contract spec。**拡張時の回帰基準** |
| `apps/api/src/routes/admin/attendance.ts` | mutation 用（attendance 登録）。**変更禁止（参照のみ）** |
| `apps/api/src/routes/admin/attendance.contract.spec.ts` | mutation contract。回帰確認 |
| `apps/api/src/routes/admin/attendance-import.contract.spec.ts` | import contract。回帰確認 |
| `apps/api/src/routes/admin/meetings.ts` | meetings CRUD。**変更禁止** |
| `apps/api/src/middleware/require-admin.ts:116-148` | JWT 検証ミドルウェア。**全新ルートでも適用** |
| `apps/api/src/repository/attendance.ts:455-563` | `computeAttendanceOverview` / `listSessionAttendanceStats` / `listMemberAttendanceRanking`。**period/zone 引数追加で Edit、または `attendance-analytics.ts` へ抽出** |

### API 新規作成（Phase 5 で実装）

- `apps/api/src/routes/admin/attendance-trend.ts`
- `apps/api/src/routes/admin/attendance-zone-distribution.ts`
- `apps/api/src/routes/admin/attendance-session-detail.ts`
- `apps/api/src/routes/admin/attendance-absentees.ts`
- `apps/api/src/routes/admin/attendance-export.ts`
- `apps/api/src/repository/attendance-analytics.ts`
- `apps/api/src/lib/csv-export.ts`

### Shared 型 / Zod

| ファイル | 目的 |
| --- | --- |
| `packages/shared/src/zod/viewmodel.ts:218-250` | 既存 `AttendanceOverviewZ` / `SessionAttendanceRowZ` / `MemberAttendanceRankingZ` (strict)。**periodFrom/periodTo/zoneFilter + previousPeriodRate 追加で Edit** |
| `packages/shared/src/zod/admin-attendance.ts` | **新規**：trend / zone-distribution / session-detail / absentee schemas |
| `packages/shared/src/types/admin-attendance.ts` | **新規**：TS 型 re-export（subpath export 用） |

### DB

| ファイル | 目的 |
| --- | --- |
| `apps/api/migrations/0002_admin_managed.sql:17-31` | `meeting_sessions` / `member_attendance` schema。**変更禁止（migration 追加なし）** |

### 認可 / Middleware

| ファイル | 目的 |
| --- | --- |
| `apps/api/src/middleware/require-admin.ts` | HS256 JWT + `AUTH_SECRET` |
| `apps/web/middleware.ts` | `/admin/:path*` UI gate |

### テスト

| ファイル | 目的 |
| --- | --- |
| `apps/api/src/routes/admin/dashboard.contract.spec.ts` | 既存 contract |
| `apps/web/src/lib/admin/__tests__/safe-server-fetch.spec.ts` | SSR fetch wrapper |
| `apps/web/playwright/tests/visual/admin-dashboard.spec.ts` | visual 既存 |
| `apps/api/src/routes/admin/__tests__/attendance-analytics.contract.spec.ts` (新規) | 新 5 endpoint contract |
| `apps/api/src/repository/__tests__/attendance-analytics.spec.ts` (新規) | 集計関数 unit |
| `apps/web/src/features/admin/attendance/__tests__/*.spec.tsx` (新規 5 本) | UI unit |
| `apps/web/playwright/tests/visual/admin-attendance.spec.ts` (新規) | visual |

### Docs / 正本仕様

| ファイル | 目的 |
| --- | --- |
| `docs/00-getting-started-manual/specs/01-api-schema.md:184-214` | API 正本仕様。**新 5 + 拡張 3 endpoint 追記で Edit** |
| `docs/30-workflows/completed-tasks/admin-attendance-analytics-redesign/_shared-context.md` | 本 SSOT（Phase 全体共通） |
| `docs/30-workflows/completed-tasks/admin-attendance-analytics-redesign/index.md` | workflow ハブ |

---

## 既存命名規則の明示（`_shared-context.md §5` 固定）

Phase 2 以降の全成果物は以下に従う。違反は Phase 3 で MAJOR 判定。

| 種別 | 規則 | 例 |
| --- | --- | --- |
| TS 識別子 | camelCase | `safeServerFetch`, `fetchAdminAttendanceTrend` |
| Component | PascalCase | `AttendanceAnalyticsPage`, `KpiPanel` |
| ファイル名 | kebab-case | `attendance-trend.ts`, `use-attendance-filters.ts` |
| Next.js page | `page.tsx` 固定 | `app/(admin)/admin/dashboard/attendance/page.tsx` |
| API パス | kebab-case + RESTful | `/admin/dashboard/attendance/zone-distribution` |
| Zod schema | `XxxZ` suffix | `AttendanceTrendZ`, `AttendanceAbsenteeZ` |
| TS type alias | `XxxView` / `XxxRow` | `AttendanceTrendView` |
| Error code | `ADMIN_FETCH_[STATUS]` | `ADMIN_FETCH_404` |
| Env var | SCREAMING_SNAKE | `INTERNAL_API_BASE_URL`, `AUTH_SECRET` |
| Test file | `*.spec.ts` / `*.spec.tsx` | `attendance-analytics.contract.spec.ts` |
| Query param | camelCase | `periodFrom`, `periodTo`, `zone`, `lastN` |
| CSS Design Token | `--ubm-*` のみ（HEX 禁止） | `var(--ubm-color-accent)` |

---

## carry-over 確認（直前タスクとの差異）

- **直前タスク**: `feat(issue-908): staging rollback notification runtime smoke specification + skill sync (#949)` (`7f651a083`)
- **carry-over 差分**:
  - 直前タスクは **rollback notification runtime smoke** の仕様化であり、本タスク（出席分析 UI/UX 刷新）と **コード重複ゼロ**
  - 共有資産: `safeServerFetch` / `AdminSectionCard` / `requireAdmin` ミドルウェア（いずれも継続利用、変更しない）
  - 直前タスクで導入された Workers staging deployment hook は本タスクの 404 原因仮説 H4（route 登録漏れ）検証に流用可能
- **未解決の前段未タスク**: なし（本タスクは新規 chain でなく独立）
- **重複作成リスク**: `AttendanceTrendChart` / `KpiPanel` 等は既存 admin 領域に**未実装**を grep で確認済（`_shared-context.md §6` の「新規作成」リストが weight 1.0）。Phase 5 開始前に再度 `find apps/web/src/features/admin -name "Kpi*"` で重複なきこと確認。

---

## targeted run ファイルリスト（vitest SIGKILL 対策）

`pnpm test` 全実行は OOM/SIGKILL 発生実績があるため、Phase 4-7 では **targeted run** を default にし、最終 Phase 9 のみ全実行とする。

### API targeted

```bash
pnpm --filter @ubm-hyogo/api test -- attendance-analytics
pnpm --filter @ubm-hyogo/api test -- dashboard.contract
pnpm --filter @ubm-hyogo/api test -- attendance.contract   # 回帰のみ（mutation 側、変更なし確認）
```

対象ファイル:

- `apps/api/src/routes/admin/__tests__/attendance-analytics.contract.spec.ts`
- `apps/api/src/repository/__tests__/attendance-analytics.spec.ts`
- `apps/api/src/routes/admin/dashboard.contract.spec.ts`（既存拡張）

### Web targeted

```bash
pnpm --filter @ubm-hyogo/web test -- AttendanceAnalyticsPage
pnpm --filter @ubm-hyogo/web test -- AttendanceTrendChart
pnpm --filter @ubm-hyogo/web test -- SessionAttendanceTable
pnpm --filter @ubm-hyogo/web test -- AttendanceDrilldownModal
pnpm --filter @ubm-hyogo/web test -- useAttendanceFilters
pnpm --filter @ubm-hyogo/web test -- safe-server-fetch    # 回帰
pnpm --filter @ubm-hyogo/web test -- AdminSidebar         # route 不変回帰
```

対象ファイル:

- `apps/web/src/features/admin/attendance/__tests__/AttendanceAnalyticsPage.spec.tsx`
- `apps/web/src/features/admin/attendance/__tests__/AttendanceTrendChart.spec.tsx`
- `apps/web/src/features/admin/attendance/__tests__/SessionAttendanceTable.spec.tsx`
- `apps/web/src/features/admin/attendance/__tests__/AttendanceDrilldownModal.spec.tsx`
- `apps/web/src/features/admin/attendance/__tests__/useAttendanceFilters.spec.ts`
- `apps/web/src/lib/admin/__tests__/safe-server-fetch.spec.ts`（既存、回帰）
- `apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx`（既存、回帰）

### Playwright targeted

```bash
pnpm --filter @ubm-hyogo/web playwright test admin-attendance
```

### Phase 9 のみ全実行

```bash
pnpm -w lint && pnpm -w build && pnpm -w test
```

---

## 404 原因仮説（`_shared-context.md §2` を継承、Phase 5/9 で確定）

優先度順に検証する。Phase 5 開始時点で 1 つ以上の仮説を **検証スクリプト or 手動確認** で潰し、Phase 9 で全消化。

| ID | 仮説 | 優先度 | 検証方法 | 解消責任 Phase |
| --- | --- | --- | --- | --- |
| H1 | staging D1 に `meeting_sessions` / `member_attendance` データ 0 件で SQL 成功するも返却が想定外パスを通る | 高 | staging D1 へ `SELECT COUNT(*)` 実行、空時に return 早期 path が 404 になっていないか repository コード trace | Phase 5 |
| H2 | `INTERNAL_API_BASE_URL` が staging で未設定 / 誤設定 → fetch URL が 404 | 高 | `wrangler secret list` / Vercel env で値確認、`safe-server-fetch` のエラーログを staging で取得 | Phase 5 |
| H3 | `server-fetch.ts` 内 fixture（task18_smoke 等）が staging で本フロー fall-through | 中 | `apps/web/src/lib/admin/server-fetch.ts:267` 周辺 fixture 分岐を Read し、`NODE_ENV` / env gating の有無を確認 | Phase 5 |
| H4 | Workers staging deployment にルート登録漏れ | 低（unlikely） | `apps/api/src/index.ts` register 行 + 実 staging で `GET /admin/dashboard/attendance/overview` を curl + `wrangler tail` でハンドラ到達確認 | Phase 5 |
| H5 | `x-internal-auth` 未設定で 401 → エラーパス分岐ミスで 404 化 | 中 | proxy 側 fetch のレスポンス status を staging で実観測、`safe-fetch.ts:20-35` の 401→404 変換有無を確認 | Phase 5 |

**Phase 9 close-out 条件**: H1〜H5 のうち真因 1 つを特定し、`outputs/phase-9/404-rca.md` に記録。残仮説は「不再現」または「対象外」として明示。

---

## 設計時の前提制約（`_shared-context.md §4` チェックリストを Phase 2 で全項目 ✅ にする）

Phase 2 設計 SubAgent はこの全項目を design.md 上で ✅ 化すること。1 つでも未達は Phase 3 で MAJOR。

- [ ] API 命名は `/admin/dashboard/attendance/*` のみで拡張、新ベースパス追加禁止
- [ ] limit は clamp / default fallback（400 不可）
- [ ] D1 直接参照禁止（apps/web は `/api/admin/*` proxy 経由）
- [ ] `safeServerFetch<T>()` で `SafeResult<T | SafeResultError>` 正規化
- [ ] partial failure は `AdminSectionError` で degrade、page `error.tsx` へ throw しない
- [ ] Sidebar route `/(admin)/admin/dashboard/attendance` を変更しない
- [ ] Design Token: `--ubm-*` のみ、HEX 直書き禁止
- [ ] 型は `packages/shared` 配置、subpath export で衝突回避（`@repo/shared/types/admin-attendance` 等）
- [ ] 集計分母: `deleted_at IS NULL` / `is_deleted != 1` の active のみ
- [ ] Sort 不変: `held_on DESC, session_id DESC`
- [ ] Admin gate 二段防御維持（UI middleware + API `requireAdmin`）
- [ ] Audit log: 本タスク read-only API のため audit 不要
- [ ] `periodFrom` / `periodTo`: `YYYY-MM-DD` 半開区間 `[from, to)`
- [ ] `zone`: カンマ区切り（`zone=0→1,1→10`）、未指定は全 zone、不正値は default fallback（400 不可）

---

## リスク・トレードオフ

| ID | リスク | 影響 | 緩和策 | 受容 |
| --- | --- | --- | --- | --- |
| R-1 | プロトタイプ準拠 Full 実装で Phase 5 工数が肥大化 | 工期遅延 | コンポーネント独立性高く Phase 5 内で parallel 実装可、また Drilldown Modal / CSV を最終サブタスク化し最悪 Phase 11 ストレッチへ送れる構成にする | 一部受容 |
| R-2 | 404 真因が H1（データ 0 件 + 早期 return 不適）の場合、UI 改修だけでは解消せず repository / API ロジック修正が必要 | scope 拡大 | Phase 5 冒頭で H1〜H5 を先に検証し、真因が repository ロジック側なら Phase 5 のサブタスクとして組み込む。新規 endpoint 追加分は影響を受けない | 受容 |
| R-3 | CSV エクスポートで大量データ時に Workers CPU/メモリ制限 (50ms/128MB) 超過 | 機能不全 | streaming response + period 上限 (例: 最大 5 年) を Phase 2 設計で制約化、テストで境界値カバー | 受容 |
| R-4 | Recharts 等 chart ライブラリ追加で bundle size 増加 | LCP 悪化 | 既存依存 (`package.json`) を Phase 2 で確認し既存採用ライブラリを優先、新規追加は dynamic import で client-only に分離 | 受容 |
| R-5 | `zone` 集計ロジックの定義（0→1 / 1→10 / 10→100 の境界）がプロトタイプ上で曖昧 | 仕様ドリフト | Phase 2 設計で SQL 上の境界条件を明示（半開区間 / 上限含むかを固定）、Phase 4 contract spec で境界値テスト追加 | 受容 |
| R-6 | `previousPeriodRate`（前期間比）の「前期間」定義が曖昧 | 仕様ドリフト | Phase 2 で `periodTo - periodFrom` の長さを直前にずらした半開区間と定義し ADR 化 | 受容 |
| R-7 | 既存 fixture（task18_smoke）削除が他テストに波及 | 回帰 | Phase 5 で fixture 削除前に `grep -rn "task18_smoke" apps/web` 実施、依存ゼロを確認してから削除 | 受容 |
| R-8 | Drilldown Modal の attendees / absentees 一覧で N+1 クエリ発生 | パフォーマンス | Phase 2 で単一 SQL（LEFT JOIN）化、Phase 4 で SQL 件数テスト | 受容 |
| R-9 | 期間フィルタ All 選択時に SessionTable が巨大化 | UX | 既存 limit 1〜200 clamp を維持、All 時はサーバ側で 200 件 + 仮想スクロール or pagination を Phase 2 で決定 | 受容 |

---

## 参照資料

- `_shared-context.md`（本 workflow の SSOT、全 Phase 共通）
- `docs/00-getting-started-manual/specs/01-api-schema.md:184-214`（API 正本仕様）
- `apps/api/migrations/0002_admin_managed.sql:17-31`（DB schema）
- `packages/shared/src/zod/viewmodel.ts:218-250`（既存 Zod）
- プロトタイプ: `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx`（現状実装、刷新対象）

## 統合テスト連携

- Phase 4 で contract spec / vitest を **赤** で書く（TDD RED）
- Phase 5 で実装し **緑** へ
- Phase 6 リファクタ後 Phase 7 で targeted run 全グリーン
- Phase 9 で `pnpm -w test` 全実行 + Playwright visual snapshot 更新
- Phase 11 で staging へ deploy し AC-1 / AC-13 を実機確認

## 多角的チェック観点（AIが判断）

- スコープ境界が IN/OUT 明示でブレないか
- 404 原因仮説が網羅的か（H1〜H5 で漏れていないか、特に CDN / edge cache や Vercel rewrites も考慮要否を Phase 2 冒頭で再検証）
- 既存命名規則違反を Phase 5 で発生させない先回り（Zod suffix `Z`、query param camelCase 等）
- API limit clamp / 400 不可規約が新 5 endpoint 全てに浸透するか
- D1 集計の `deleted_at IS NULL` フィルタが全関数で適用されるか

## サブタスク管理

Phase 1 サブタスクなし（単一仕様書）。

## 成果物

- `docs/30-workflows/completed-tasks/admin-attendance-analytics-redesign/phase-1.md`（本ファイル）
- `docs/30-workflows/completed-tasks/admin-attendance-analytics-redesign/outputs/phase-1/p50-precheck.md`（P50 チェック結果）

## 完了条件

- [ ] 本 phase-1.md に AC-1〜AC-16 が記載されている
- [ ] スコープ IN/OUT が `_shared-context.md §3 Full モード` と一致
- [ ] 既存インベントリに `_shared-context.md §1, §6` の全ファイルが反映
- [ ] 既存命名規則表が `_shared-context.md §5` と一致
- [ ] 404 原因仮説 H1〜H5 が記載
- [ ] 設計時前提制約チェックリストが `_shared-context.md §4` と一致
- [ ] リスク R-1〜R-9 が記載
- [ ] P50 precheck 結果が `outputs/phase-1/p50-precheck.md` に記録（または記録予定が明示）

## タスク100%実行確認【必須】

- [ ] [実装区分: 実装仕様書] / `implementation_mode: new` / `task_classification: UI task (VISUAL)` を冒頭固定済
- [ ] CONST_004 / CONST_005 を明示済
- [ ] AC を番号付き（AC-1〜AC-16）で列挙済
- [ ] スコープ含む / 含まないを明示済
- [ ] インベントリ Web / API / Shared / DB / 認可 / テスト / Docs を列挙済
- [ ] 既存命名規則テーブル化済
- [ ] carry-over 差異記録済
- [ ] targeted run ファイルリスト + Phase 9 のみ全実行を明示済
- [ ] 404 原因仮説 5 件記載済
- [ ] 設計時前提制約チェックリスト 14 項目記載済
- [ ] リスク 9 件記載済

## 次Phase

- **Phase 2: 設計** — 本 Phase の AC / 制約チェックリスト / インベントリを入力に、コンポーネント階層 / API スキーマ詳細 / SQL 設計 / URL クエリ規約 / CSV format / chart ライブラリ選定を確定する。

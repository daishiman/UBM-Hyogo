[実装区分: 実装仕様書]

# Phase 8: リファクタリング

## 依存
- **前提**: Phase 7（実装）完了 + 全テストグリーン（contract / vitest / Playwright）
- **参照**: `_shared-context.md` §1, §6, §8
- **不変条件**: 振る舞い不変（全テスト維持）/ 公開 API シグネチャ不変 / Zod schema 不変

---

## 1. リファクタ対象候補

| # | 候補 | 動機 | 対象範囲 |
| - | ---- | ---- | -------- |
| R1 | 重複 SQL の共通化 | overview / by-session / ranking / trend / zone-distribution / absentees で `meeting_sessions ⨯ member_attendance ⨯ members` の JOIN + `held_on BETWEEN ?` + `deleted_at IS NULL` が重複 | `apps/api/src/repository/attendance-analytics.ts` 内に `buildAttendanceBaseQuery(period, zone)` を抽出 |
| R2 | period parser の utility 化 | 各ルート (`attendance-trend.ts` 等) で `periodFrom / periodTo` の Date parse + default fallback + clamp が散在 | `apps/api/src/lib/period-filter.ts` に `parsePeriodFilter(query): { from: Date; to: Date; zones: Zone[] }` を新設 |
| R3 | CSV ヘッダ生成の共通化 | `attendance-export.ts` で `Content-Type: text/csv; charset=utf-8` + `Content-Disposition: attachment; filename=...` ヘッダ組立が複数箇所（session / member / absentee CSV）に分散 | `apps/api/src/lib/csv-export.ts` の `buildCsvResponse(rows, { filename, columns })` に集約 |
| R4 | KPI 計算の helper 化 | overview の `rate = attendees / (sessions * activeMembers)` / `previousPeriodRate` / `trendRatio` が API + Web (`format-attendance.ts`) で重複 | `packages/shared/src/lib/attendance-kpi.ts` に `computeAttendanceRate / computeTrendRatio` を抽出し API/Web 双方が import |

---

## 2. 変更内容ログ（FB RT-03 準拠）

| 対象 | Before | After | 理由 |
| ---- | ------ | ----- | ---- |
| `apps/api/src/repository/attendance-analytics.ts` | `computeAttendanceOverview` / `listSessionAttendanceStats` / `listMemberAttendanceRanking` / `computeAttendanceTrend` / `computeZoneDistribution` がそれぞれ FROM 句と WHERE 句を直書き | `buildAttendanceBaseQuery({ from, to, zones })` を抽出し各関数は SELECT 句のみ記述 | R1 重複削減・WHERE 条件齟齬リスク排除 |
| `apps/api/src/lib/period-filter.ts` (新規) | 各ルートで `new Date(c.req.query('periodFrom') ?? defaultFrom)` を 8 箇所コピペ | `parsePeriodFilter(c.req.query())` 単一エントリ + default fallback + zone CSV split を集約 | R2 clamp/fallback ロジックの単一化（§3 正本仕様遵守チェックリスト「limit は clamp」と同思想） |
| `apps/api/src/lib/csv-export.ts` | `attendance-export.ts` で `c.header('Content-Type', ...)` + `c.header('Content-Disposition', ...)` + 手動 escape を直書き | `buildCsvResponse(c, { filename, columns, rows })` ヘルパに集約。RFC 4180 escape (`,` / `"` / `\n`) も内部で処理 | R3 CSV 仕様準拠の一点保証・filename UTF-8 RFC 5987 対応 |
| `packages/shared/src/lib/attendance-kpi.ts` (新規) | API `computeAttendanceOverview` と Web `format-attendance.ts` で `rate = totalAttendees / (sessionCount * memberCount)` が重複 | `computeAttendanceRate({ attendees, sessions, members })` / `computeTrendRatio(current, previous)` を export | R4 計算式 SSOT 化・将来の母数定義変更を一箇所で完結 |
| `apps/web/src/features/admin/attendance/lib/format-attendance.ts` | 自前で rate を計算 | `@repo/shared/lib/attendance-kpi` から import に置換 | R4 同上 |
| `apps/api/src/routes/admin/attendance-*.ts` (5 ファイル) | period/zone parse + base query を各々呼び出し | `parsePeriodFilter` + repository 関数呼び出しのみに簡素化 | R1+R2 連動。ルートは I/O 変換層に純化 |

> **記録ルール**: 各行 1 リファクタ。Phase 13 でユーザーが commit を承認した場合のみ、対象 1 ファイル群 = 1 commit を推奨し、commit message に `refactor(attendance-analytics): R1 - extract buildAttendanceBaseQuery` のように対応 ID を明記する。

---

## 3. ナビゲーション drift 確認

リファクタで URL / 表示パスが変わっていないことを確認する。

| 項目 | 期待値 | 検証手順 |
| ---- | ------ | -------- |
| Sidebar route | `/admin/dashboard/attendance`（不変） | `rg "dashboard/attendance" apps/web/src/components/layout/AdminSidebar.tsx` |
| Breadcrumb | `ダッシュボード > 出席分析` | Playwright `admin-attendance.spec.ts` の breadcrumb assertion 既存ケースが pass |
| URL クエリ規約 | `periodFrom` / `periodTo` / `zone` の仕様不変（§3.URL クエリ規約） | `pnpm --filter @ubm-hyogo/web test -- useAttendanceFilters` |
| API パス | `/admin/dashboard/attendance/*` のみ（新ベースパス追加禁止） | `rg "app\\.route\\(.*attendance" apps/api/src/index.ts` で全 8 ルートが prefix 一致 |
| ルート登録漏れ | 全 8 エンドポイント (`overview / by-session / ranking / trend / zone-distribution / sessions/:id/attendees / absentees / export`) が `apps/api/src/index.ts` に残存 | contract spec の `describe.each` カバレッジで担保 |

> drift を検知した場合は即座にリファクタを revert し、Phase 7 仕様へ差し戻す。

---

## 4. 既存 `attendance.ts` と 新 `attendance-analytics.ts` の責務分離

| ファイル | 責務 | 提供関数 | 依存可否 |
| -------- | ---- | -------- | -------- |
| `apps/api/src/repository/attendance.ts` | **書込み + 基本 read**（既存 admin 管理画面用）<br>セッション CRUD / 出席 assign / 単純 list | `createSession`, `assignAttendance`, `listSessions`, `getSessionById`, ... | 他 repository から呼ばれてよい |
| `apps/api/src/repository/attendance-analytics.ts` (新) | **分析 read のみ**（read-only aggregation）<br>期間/zone フィルタ付き集計・KPI・trend・distribution・absentee | `computeAttendanceOverview`, `listSessionAttendanceStats`, `listMemberAttendanceRanking`, `computeAttendanceTrend`, `computeZoneDistribution`, `getSessionDetail`, `listAbsentees`, `streamExportRows` | **`attendance.ts` を import しない**。共有定数 (`MEMBER_ZONES` 等) のみ `apps/api/src/lib/` から取得 |

**移管ルール**:
- Phase 7 で `attendance.ts:455-563` にあった `computeAttendanceOverview / listSessionAttendanceStats / listMemberAttendanceRanking` を `attendance-analytics.ts` へ **移設**（コピーではなく cut）。
- 移設後 `attendance.ts` から該当関数を delete し、呼び出し元（`dashboard.ts` 等）の import パスを `@/repository/attendance-analytics` に更新。
- `attendance.ts` 側に集計ロジック残骸 (helper 関数等) があれば一緒に移管し、双方向依存を作らない。
- 循環依存検知: `pnpm --filter @ubm-hyogo/api exec madge --circular src/repository` を実行し 0 件を確認。

---

## 5. 退行確認: 全テスト再実行

```bash
# API
pnpm --filter @ubm-hyogo/api lint
pnpm --filter @ubm-hyogo/api build
pnpm --filter @ubm-hyogo/api test
pnpm --filter @ubm-hyogo/api test -- attendance-analytics

# shared
pnpm --filter @ubm-hyogo/shared lint
pnpm --filter @ubm-hyogo/shared build
pnpm --filter @ubm-hyogo/shared test

# Web
pnpm --filter @ubm-hyogo/web lint
pnpm --filter @ubm-hyogo/web build
pnpm --filter @ubm-hyogo/web test
pnpm --filter @ubm-hyogo/web test -- AttendanceAnalyticsPage

# Playwright visual
pnpm --filter @ubm-hyogo/web playwright test admin-attendance

# 循環依存
pnpm --filter @ubm-hyogo/api exec madge --circular src/repository

# 全部
pnpm -w lint && pnpm -w build && pnpm -w test
```

**失敗時アクション**: 直前 commit を `git revert` し、対象リファクタを単独で再分析。Phase 7 のテストを変更してはならない（変更が必要なら振る舞いが変わっている = リファクタではない）。

---

## 6. DoD（Phase 8 完了条件）

1. [ ] R1〜R4 のリファクタが全て適用済み、または **適用不可と判定した理由が §2 表に記録済み**
2. [ ] `pnpm -w lint && pnpm -w build && pnpm -w test` グリーン
3. [ ] Playwright `admin-attendance.spec.ts` グリーン（visual diff 0px）
4. [ ] `madge --circular` 0 件
5. [ ] §3 ナビゲーション drift 検証 5 項目すべて期待値一致
6. [ ] §4 責務分離: `attendance.ts` から集計関数が削除され、`attendance-analytics.ts` 単独で完結（grep で重複定義 0 件）
7. [ ] Zod schema / 公開 API path / レスポンス JSON 構造が Phase 7 と完全一致（contract spec が無変更で pass）
8. [ ] `01-api-schema.md` の記述に齟齬が出ていない（spec drift なし）
9. [ ] Phase 13 の commit 承認前は `outputs/phase-8/refactor-change-groups.md` に R1/R2/R3/R4 対応の変更グループが記録されている。commit 後は履歴が同グループと対応している

> **振る舞い不変の最終確認**: `git diff <phase-7-baseline>..HEAD -- 'apps/**/*.spec.*'` の差分を確認し、リファクタ都合でテスト期待値を書き換えていないことを `outputs/phase-8/refactor-change-groups.md` に記録する。

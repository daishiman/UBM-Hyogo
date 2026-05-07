# Phase 8: DRY 化

実装区分: 実装仕様書（CONST_004 デフォルト適用 — admin attendance 集計可視化ダッシュボードの実装仕様）

## 8.1 方針サマリ

本タスクは attendance の **集計可視化（read-only）** に閉じる。followup-001 の write path と異なり aggregate SQL は単発 GROUP BY で完結するため、**chunk pattern（`IN (?,?,...)` バッチ）は集計クエリには一切流用しない**。共通化判断もこの前提に従い「過剰抽象を避け、独立した GROUP BY 関数として並列に置く」ことを基本方針とする。

## 8.2 共通化候補

| # | 共通化対象 | 配置候補 | 効果 |
| --- | --- | --- | --- |
| D1 | `apps/api/src/repository/attendance.ts` の aggregate 3 関数（`computeAttendanceOverview` / `listSessionAttendanceStats` / `listMemberAttendanceRanking`） | 既存 `attendance.ts` 末尾追記 | 同 schema を扱うため近接配置で可読性確保。helper 抽出はしない |
| D2 | admin route の response shape `{ ok: true, data }` | `apps/api/src/routes/admin/dashboard.ts` 内で直接記述 | 既存 admin route 慣習（`05a` / followup-001）に合わせ、新規 envelope helper は導入しない |
| D3 | admin gate middleware | `apps/api/src/routes/admin/_middleware.ts`（既存・05a 由来） | 流用のみ。新規追加なし |
| D4 | `EXPLAIN QUERY PLAN` 検証 helper | `apps/api/src/repository/__tests__/_setup.ts` に `assertNoFullScan(plan: string)` 追加 | 3 つの aggregate test で同じ plan 検証を再利用。対象表 full scan 検出 → fail を共通化 |
| D5 | `placeholders(n)` / `ctx(c)` 等の既存 SQL helper | `apps/api/src/repository/_shared/sql.ts` | 既存をそのまま流用。aggregate でも `LIMIT ?` の bind 等で利用 |
| D6 | analytics 専用 index DDL | `apps/api/migrations/00XX_attendance_analytics_indexes.sql`（新規 1 ファイル） | aggregate 3 本が利用する composite index を 1 migration に集約。02b との番号衝突は Phase 9 で gate |

## 8.3 採用判断

| # | 採用 | 理由 |
| --- | --- | --- |
| D1 | ◯ 採用（並列配置） | 3 関数を独立 SQL 関数として末尾追記。共通 base 関数化はしない（GROUP BY 軸が異なるため抽象が薄まる） |
| D2 | ◯ 採用（既存慣習踏襲） | `{ ok: true, data }` envelope を route 直書きで統一。専用 helper 化は不要 |
| D3 | ◯ 採用（流用のみ） | `requireAdmin` middleware を new route mount 時に再利用。新規 admin gate は作らない |
| D4 | ◯ 採用 | `assertNoFullScan()` を test util に追加。3 aggregate test の重複コードを除去できるため効果大 |
| D5 | ◯ 採用 | `ctx(c)` / `placeholders(n)` の既存 helper をそのまま使用 |
| D6 | ◯ 採用 | 1 migration に集約することで index 単位での rollback が容易 |

## 8.4 DRY しないと判断する箇所

| 箇所 | 理由 |
| --- | --- |
| aggregate 3 関数の SQL 本体 | GROUP BY 軸（overview = 集計 1 行 / session 別 / member 別）が異なるため、SQL 共通化すると分岐パラメータが増えて読みにくくなる。**3 関数は独立に置く** |
| `AttendanceOverview` / `SessionAttendanceRow` / `MemberAttendanceRanking` の row 型 | 各 aggregate 固有の field 集合を持つため、union / generics で抽象化しない |
| chunk pattern の集計流用 | 集計は単発 GROUP BY で完結するため、followup-001 read path の `IN (?,?,...)` chunk pattern は **意図的に流用しない**（不要な複雑化を避ける） |
| admin UI 側 fetch 層 | `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` 内で `fetch` を直書きする。専用 client SDK は本タスクでは作らない |

## 8.5 既存 helper 流用一覧

| helper | 配置 | 用途 |
| --- | --- | --- |
| `requireAdmin` / admin gate middleware | `apps/api/src/routes/admin/_middleware.ts` | 新規 dashboard route に適用 |
| `ctx(c)` | `apps/api/src/repository/_shared/sql.ts` | D1 binding 取得 |
| `placeholders(n)` | `apps/api/src/repository/_shared/sql.ts` | bind パラメータ生成（aggregate では `LIMIT ?` 用に最小限利用） |
| `audit_log` 経路 | 既存（変更なし） | 本タスクは read-only のため audit 記録なし |
| Vitest fixtures（attendance test 用） | `apps/api/src/repository/__tests__/_setup.ts` | aggregate test の seed に再利用 |

## 8.6 過剰抽象化リスクと回避

| 反パターン | 回避策 |
| --- | --- |
| 「aggregate 共通 base 関数」を導入する | 採用しない。3 関数は独立 SQL のまま |
| chunk pattern を集計に持ち込む | **禁止**。GROUP BY 単発で十分 |
| response envelope helper を新設する | 採用しない。既存 admin route 慣習を踏襲 |
| admin UI で early-bound DTO 型を別パッケージ化 | 採用しない。MVP では route 直下の inline 型で十分 |

## 8.7 DoD

- 8.3 の D1〜D6 のうち採用分が Phase 5 までに反映されている
- 8.4 の「DRY しない箇所」が新規コードで誤って共通化されていないことを Phase 9 grep gate で検査
- chunk pattern が aggregate 関数 / migration / test のいずれにも導入されていないこと
- 既存 helper 流用一覧（8.5）の関数が新規 route / repository から正しく import されていること

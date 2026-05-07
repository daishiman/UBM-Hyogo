# Phase 7: AC マトリクス

実装区分: 実装仕様書（CONST_004 デフォルト適用）

## 7.1 AC × test × 不変条件 × evidence

| AC | 内容 | tests | 不変条件 | evidence |
| --- | --- | --- | --- | --- |
| AC-1 | aggregate API 3 本（overview / by-session / ranking）が GROUP BY 単発クエリで完結（chunk pattern 非流用） | T1, T2, T3, T4, T5, T6, T7, T8, T12 | #1, #4, #5 | `attendance-analytics.test.ts` PASS、`attendance.ts` 末尾追加実装、grep で chunk import 不在 |
| AC-2 | 各 API は 05a admin gate を経由し非 admin は 401/403 | T13, T14, T15, T16, T17 | admin gate 中継、#5 | `dashboard.test.ts` PASS、curl evidence `dashboard-attendance-unauthorized-401.json` |
| AC-3 | `EXPLAIN QUERY PLAN` で対象表の full scan を含まない | T9, T10, T11, T22 | #1, #4 | EXPLAIN QUERY PLAN テスト出力、perf test ログ |
| AC-4 | 新規 migration ファイルで analytics 専用 index 追加 | T9, T10, T11 | #5 | `apps/api/migrations/0015_attendance_analytics_indexes.sql`、ローカル apply ログ |
| AC-5 | 集計結果型 3 種（`AttendanceOverview` / `SessionAttendanceRow` / `MemberAttendanceRanking`） | T1, T4, T7, T13, T14, T15 | MemberProfile.attendance 不変、#4 | type 定義箇所、route JSON shape assertion |
| AC-6 | admin UI ページで 3 つのカード/テーブル描画 | T18 | #5（D1 直接アクセスなし） | Playwright smoke 出力、ui-smoke ログ |
| AC-7 | 単体テスト + route 統合テスト + UI smoke 全レイヤカバー | T1〜T17（unit + route）+ T18（UI smoke） | #1, #4, #5 | 各 test PASS ログ |
| AC-8 | D1 直接アクセスは apps/api に閉じる（apps/web から D1 import なし） | T21 | #5 | grep `D1Database` in `apps/web` で 0 件 |
| AC-9 | `MemberProfile.attendance` 型契約不変 | T20 | MemberProfile.attendance 不変、#1 | typecheck PASS、grep diff |
| AC-10 | focused tests + typecheck + lint PASS、regression なし | T19 | — | CI green、`pnpm test:run` / `pnpm typecheck` / `pnpm lint` ログ |
| AC-11 | API smoke evidence 4 ケース | — | — | `outputs/phase-11/evidence/api-curl/dashboard-attendance-{overview-ok,by-session-ok,ranking-ok,unauthorized-401}.json` |

## 7.2 不変条件 × AC マッピング

| 不変条件 | 該当 AC |
| --- | --- |
| #1 実フォーム schema をコードに固定しすぎない | AC-1, AC-3, AC-7, AC-9（aggregate は schema を fix せず GROUP BY で集計） |
| #4 Google Form schema 外のデータは admin-managed data として分離 | AC-1, AC-2, AC-5, AC-6（attendance は admin-managed、admin gate 経由） |
| #5 D1 への直接アクセスは apps/api に閉じる | AC-1, AC-2, AC-4, AC-6, AC-8（aggregate は apps/api 内のみ、UI は fetch 経由） |
| MemberProfile.attendance 型契約不変 | AC-5, AC-9（新規型は別 interface として導入し、既存 MemberProfile.attendance を変更しない） |
| admin gate 中継 | AC-2, AC-7（全 3 endpoint が `app.use("/admin/*", adminGate)` を通る） |

## 7.3 トレース完全性チェック

- AC-1〜11 すべてが少なくとも 1 つの test または evidence にマップされている → ✅
- 不変条件 #1, #4, #5, MemberProfile.attendance 不変, admin gate がそれぞれ 1 つ以上の AC にマップされている → ✅
- 13 phases の各 phase outputs に該当 AC の根拠が残る → ✅（Phase 4: test, Phase 5: 実装ログ, Phase 6: 異常系, Phase 11: evidence）

## 7.4 完了判定

- 7.1 マトリクスの全行が green（実装後に評価）
- 不足列があれば Phase 5 ランブックに戻り test 追加または migration 修正
- chunk pattern 非流用が AC-1 / Phase 4 T12 / Phase 6 F11 の三層で保証されていること
- 02b との migration 番号衝突なし（Phase 5 §5.3 / Phase 6 §6.5）

## 7.5 残課題

- なし（残課題なし宣言）。
- runtime curl evidence は未取得として Phase 11 に記録し、実測 PASS とは扱わない。local implementation cycle では repository / route / EXPLAIN Vitest gate を証跡とする。

## 7.6 DoD

- 7.1 マトリクスが Phase 5 完了後に全 cell 充足
- Phase 11 evidence が AC-11 を満たす（4 ケース JSON）
- 不変条件 #1 / #4 / #5 / MemberProfile.attendance 不変 / admin gate のいずれにも違反がない
- chunk pattern が aggregate 層に流用されていないことが grep + 構造的に保証されている

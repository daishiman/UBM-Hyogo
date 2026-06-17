# Phase 13 — 変更概要

> ステータス: `implemented_local_visual_present_staging_pending`。apps/web 実装・focused 検証済み。commit / PR / push / authenticated staging capture は user 承認後のみ。

---

## 1. 変更の柱

`/(admin)/admin/dashboard/attendance`（出席ダッシュボード）の表現層のみを変更し、**英語表記・エンジニア専門語を平易な日本語へ置換**する文字列リネームが中心。データ取得（6 endpoint bundle）・API・D1・Google Form schema・`packages/shared` 型は不変（AC-7）。3 ゾーン骨格・DOM 構造・testid・href・role は維持。

## 2. 変更ファイル想定（_shared-context §9 の 16 ファイル）

| 区分 | パス | 変更 | 証跡（実装後） |
| --- | --- | --- | --- |
| 修正 | `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` | R-01（eyebrow 日本語化） | grep 英語 0 件 |
| 修正 | `.../components/AttendanceAnalyticsPage.tsx` | R-02〜R-06 / S-10 / J-02 / J-05 | grep / 構造テスト |
| 修正 | `.../components/KpiPanel.tsx` | S-01〜S-03 / J-03 / J-04 / J-06 / J-12 | `KpiPanel.spec.tsx` |
| 修正 | `.../components/AttendanceAbsenteeAlert.tsx` | S-04 / S-05 / U-01 | 構造テスト |
| 修正 | `.../components/AttendanceDetailTabs.tsx` | R-07 / R-08 / S-06 / S-07 | `AttendanceDetailTabs.spec.tsx` |
| 修正 | `.../components/AttendanceFilterBar.tsx` | R-09 / J-10 | grep |
| 修正 | `.../components/AttendanceTrendChart.tsx` | S-09 / J-01 | aria-label テスト |
| 修正 | `.../components/AttendanceZoneDistributionChart.tsx` | J-08 / J-09 | `AttendanceZoneDistributionChart.spec.tsx` |
| 修正 | `.../components/SessionAttendanceTable.tsx` | S-08 | empty 文言テスト |
| 修正 | `.../lib/format-attendance.ts` | R-10 / J-07 / J-11 | `format-attendance.spec.ts` |
| 修正（任意） | `apps/web/src/styles/globals.css` | U-03（はみ出し回避・必要時） | verify-design-tokens PASS |
| 修正（追従） | `.../__tests__/AttendanceZoneDistributionChart.spec.tsx` | T-01 + 回帰 | focused vitest |
| 修正（追従） | `.../__tests__/AttendanceDetailTabs.spec.tsx` | T-02〜T-04 + 回帰 | focused vitest |
| 修正（回帰） | `.../__tests__/KpiPanel.spec.tsx` | J-03 / S-01 回帰 | focused vitest |
| 修正（回帰） | `.../__tests__/format-attendance.spec.ts` | R-10 / J-07 回帰 | focused vitest |
| 修正（追従） | `apps/web/playwright/tests/admin-attendance-dashboard-ux.spec.ts` | T-05 / T-06 追従 | Playwright |
| **変更なし** | `apps/api/**` / `packages/shared/**` | AC-7 | diff 0 件 |

## 3. AC 充足記録（実装後に埋める）

| AC | 充足（実装後） | 証跡 |
| --- | --- | --- |
| AC-1 英語表記の日本語化 | [x] | grep（PRIMARY/TREND/DETAIL/TOP10/CSV 等 UI-facing 0 件） |
| AC-2 「セッション」→「開催回」 | [x] | grep（画面表示の「セッション」0 件） |
| AC-3 専門語の平易化 | [x] | grep / focused tests（トレンド/ユニーク/区画/帯/pt を置換） |
| AC-4 見やすさ微調整 | [x] | CSS rhythm 補強 / 視覚証跡は staging pending |
| AC-5 OKLch token（HEX 0） | [x] | verify-design-tokens PASS |
| AC-6 新規 primitive/component 0 | [x] | 既存 component / CSS / tests のみ |
| AC-7 API/D1/Form/shared 不変 | [x] | `apps/api`/`packages/shared` diff 0 |
| AC-8 DOM contract 保持 | [x] | testid/href/role 不変・aria 文言のみ意図的変更 |
| AC-9 テスト追従 + 回帰 | [x] | focused vitest 8 files / 23 tests PASS |
| AC-10 機能温存 | [x] | フィルタ/書き出し/modal/degrade の構造不変 |

## 4. テスト結果（実装後に埋める）

| スイート | 件数 | 結果 |
| --- | --- | --- |
| 出席 feature component/lib spec | 8 files / 23 tests | PASS |
| token gate（HEX 0） | 91 tracked | PASS |
| Phase 12 implementation-guide validator | 12/12 | PASS |
| typecheck / lint | repo | PASS |

## 5. screenshot 取得記録（実装後に埋める）

| canonical 名 | 取得 |
| --- | --- |
| attendance-dashboard-full-jp | [ ] |
| attendance-overview-zone-jp | [ ] |
| attendance-trend-zone-jp | [ ] |
| attendance-detail-tabs-jp | [ ] |
| attendance-filter-bar-jp | [ ] |
| attendance-dashboard-mobile-jp | [ ] |

# Phase 13 — 変更概要

> ステータス: `implemented_local_checks_pass_visual_capture_pending`。commit / PR / push は user 承認後のみ。

---

## 1. 変更ファイル想定（component-map 由来）

| 区分 | パス | 変更 | 証跡 |
| --- | --- | --- | --- |
| 新規 | `apps/web/src/features/admin/attendance/components/AttendanceDetailTabs.tsx` | DETAIL Segmented タブホスト（internal state） | `AttendanceDetailTabs.spec.tsx` PASS |
| 新規 | `apps/web/src/features/admin/attendance/lib/attendance-follow-level.ts` | `attendanceFollowLevel` 純粋関数 | `attendance-follow-level.spec.ts` PASS |
| 修正 | `apps/web/src/features/admin/attendance/components/AttendanceAnalyticsPage.tsx` | PRIMARY / TREND / DETAIL の 3 ゾーンへ再構成 | focused Vitest / typecheck / lint PASS |
| 修正 | `apps/web/src/features/admin/attendance/components/KpiPanel.tsx` | PRIMARY hero + secondary KPI 分離 | `KpiPanel.spec.tsx` PASS |
| 修正 | `apps/web/src/features/admin/attendance/components/AttendanceAbsenteeAlert.tsx` | PRIMARY hero 化 + `data-attendance-follow` | `AttendanceAbsenteeAlert.spec.tsx` PASS |
| 修正 | `apps/web/src/styles/globals.css` | 3 層クラス追加・リズム調整 | verify-design-tokens PASS |
| 修正（追従） | `apps/web/src/features/admin/attendance/__tests__/*.spec.tsx` | 既存 spec 追従 + 新規 spec | focused Vitest 8 files / 23 tests PASS |
| **変更なし** | `apps/api/**` / `packages/shared/**` | AC-7 | diff 0 件 |

## 2. AC 充足記録（実装後に埋める）

| AC | 充足（実装後） | 証跡 |
| --- | --- | --- |
| AC-1 PRIMARY ヒーロー | [x] | KpiPanel component spec / code diff |
| AC-2 3 層階層 | [x] | `AttendanceAnalyticsPage` 3 section DOM |
| AC-3 Segmented タブ統合 | [x] | `AttendanceDetailTabs.spec.tsx` |
| AC-4 要フォロートーン | [x] | `attendance-follow-level.spec.ts` / `AttendanceAbsenteeAlert.spec.tsx` |
| AC-5 OKLch token（HEX 0） | [x] | verify-design-tokens PASS |
| AC-6 新規 primitive 0 | [x] | `components/ui/` diff 0 |
| AC-7 API/D1/shared 不変 | [x] | `apps/api`/`packages/shared` diff 0 |
| AC-8 レスポンシブ | [x] | CSS media query / grid classes |
| AC-9 a11y | [x] | section `aria-labelledby` / existing Segmented `radiogroup` |
| AC-10 機能温存 | [x] | focused Vitest 8 files / 23 tests PASS |

## 3. MINOR 解決記録（実装後に埋める）

| MINOR | 解決 | 証跡 |
| --- | --- | --- |
| M-1 className 二重整理 | [x] | 3 zone wrapper / existing page testid retained |
| M-2 `data-attendance-follow` 命名分離 | [x] | `AttendanceAbsenteeAlert` 属性 + pure function |
| M-3 既存 spec 追従 | [x] | focused Vitest PASS |

## 4. テスト結果（実装後に埋める）

| スイート | 件数 | 結果 |
| --- | --- | --- |
| 出席 feature component spec | focused 実行総計 8 files / 23 tests | PASS |
| 出席 feature lib spec | 3 files / 9 tests | PASS |
| token gate（HEX 0） | 1 file / 9 tests | PASS |
| typecheck / lint | — | PASS |

## 5. screenshot 取得記録（実装後に埋める）

| canonical 名 | 取得 |
| --- | --- |
| attendance-dashboard-full | [ ] |
| attendance-primary-hero-followup-ok | [ ] |
| attendance-primary-hero-followup-warn | [ ] |
| attendance-trend-zone | [ ] |
| attendance-detail-tabs-session | [ ] |
| attendance-detail-tabs-member | [ ] |
| attendance-detail-tabs-top10 | [ ] |
| attendance-dashboard-mobile | [ ] |

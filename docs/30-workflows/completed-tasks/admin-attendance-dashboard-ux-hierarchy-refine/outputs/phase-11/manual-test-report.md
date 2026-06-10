# Phase 11 手動テストレポート — admin-attendance-dashboard-ux-hierarchy-refine

## 証跡メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | admin-attendance-dashboard-ux-hierarchy-refine |
| タスク種別 | VISUAL（UI 表現層の 3 層リファイン） |
| 状態 | pending_visual_capture（実装・ローカル機械検証済み、実 screenshot 未取得） |
| visualEvidence | `VISUAL_CAPTURE_PENDING` |
| 証跡の主ソース | (1) Playwright visual capture 8 枚（未取得）/ (2) 自動テスト: focused vitest 8 files / 23 tests PASS |
| 実 capture 予定環境 | staging 認証済み admin（`/admin/dashboard/attendance`）・admin bearer mint 後・**user-gated** |

## なぜこの段階で実 screenshot が未取得か

実コードは本ブランチで実装済みだが、対象 route は admin 認証必須であり、計画上の capture runtime は staging 認証済み admin + admin bearer mint + user-gated Playwright である。現ワークツリーには 8 canonical PNG が未配置のため、Phase 11 は `pending_visual_capture` として扱う。

## capture 対象（screenshot-plan.json / phase11-capture-metadata.json と一致）

| # | canonical 名 | TC | viewport | 確認状態 |
| --- | --- | --- | --- | --- |
| 1 | `attendance-dashboard-full.png` | TC-V-01 | desktop | 3 層全体（after） |
| 2 | `attendance-primary-hero-followup-ok.png` | TC-V-02 | desktop | 要フォロー 0 件（success/neutral トーン） |
| 3 | `attendance-primary-hero-followup-warn.png` | TC-V-03 | desktop | 要フォロー 1+ 件（warning トーン） |
| 4 | `attendance-trend-zone.png` | TC-V-04 | desktop | TREND 2 カラム |
| 5 | `attendance-detail-tabs-session.png` | TC-V-05 | desktop | DETAIL タブ=セッション別 |
| 6 | `attendance-detail-tabs-member.png` | TC-V-06 | desktop | DETAIL タブ=会員別 |
| 7 | `attendance-detail-tabs-top10.png` | TC-V-07 | desktop | DETAIL タブ=TOP10 |
| 8 | `attendance-dashboard-mobile.png` | TC-V-08 | mobile | 1 カラム縦積み |

## 自動テスト証跡

| 区分 | 対象 | 結果 | 参照 |
| --- | --- | --- | --- |
| component spec（既存追従） | KpiPanel / AttendanceTrendChart / AttendanceZoneDistributionChart | PASS | `pnpm exec vitest run apps/web/src/features/admin/attendance --root .` |
| component spec（新規） | AttendanceDetailTabs / AttendanceAbsenteeAlert | PASS | 同上 |
| pure 関数 spec（新規） | attendanceFollowLevel（branch 0/1+） | PASS | 同上 |
| lib spec（既存） | format-attendance / buildExportUrl | PASS | 同上 |

## source-level PASS と環境ブロッカーの分離（[WEEKGRD-01]）

| 区分 | 内容 |
| --- | --- |
| source-level（仕様で担保） | 3 層 DOM 構造・トーン分岐・タブ排他・degrade・token のみ使用は component spec + token gate で担保（Phase 4/7/9） |
| 環境ブロッカー（実装サイクルで解消） | staging deploy・admin bearer mint・実ブラウザ capture は user-gated。esbuild/worktree drift は `pnpm install` で事前解消 |

## 結論

- 実装・自動テスト・typecheck・lint・token gate は完了。
- 実 capture・PNG 配置は未完了。8 canonical PNG が配置されるまで VISUAL evidence は pending。

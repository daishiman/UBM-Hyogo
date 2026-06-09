# Phase 11 — VISUAL 証跡記録（テンプレート）

> ステータス: `pending_visual_capture` / visualScope=`VISUAL` / visualEvidence=`VISUAL_CAPTURE_PENDING`。
> 実装とローカル機械検証は完了。8 canonical screenshot は staging 認証済み admin capture が未取得。

---

## 1. 証跡の主ソース

| ソース | 内容 | 状態 |
| --- | --- | --- |
| VISUAL screenshot | `screenshot-plan.json` の 8 canonical 名（`/admin/dashboard/attendance` desktop 7 + mobile 1） | 未取得（user-gated staging capture pending） |
| 自動テスト（component spec） | hero 描画 / `attendanceFollowLevel`（none/warn）トーン切替 / Segmented 排他表示 / SafeResult タブ単位 degrade | PASS（focused vitest 8 files / 23 tests） |
| 自動テスト（既存温存） | `KpiPanel` / `AttendanceTrendChart` / `AttendanceZoneDistributionChart` の component spec 3 本 + `format-attendance` / `buildExportUrl` の lib spec 2 本 | PASS |
| token gate | `verify-design-tokens`（HEX 0 件） | PASS（9 tests） |

## 2. screenshot 記録表（実 capture 後に埋める）

| # | canonical 名 | tc | 取得 | 結果（PASS/FAIL） | 備考 |
| --- | --- | --- | --- | --- | --- |
| ① | `attendance-dashboard-full.png` | TC-V-01 | [ ] | — | 3 層全体 |
| ② | `attendance-primary-hero-followup-ok.png` | TC-V-02 | [ ] | — | 要フォロー 0 件 |
| ③ | `attendance-primary-hero-followup-warn.png` | TC-V-03 | [ ] | — | 要フォロー 1+ 件 |
| ④ | `attendance-trend-zone.png` | TC-V-04 | [ ] | — | TREND 2 カラム |
| ⑤ | `attendance-detail-tabs-session.png` | TC-V-05 | [ ] | — | DETAIL=session |
| ⑥ | `attendance-detail-tabs-member.png` | TC-V-06 | [ ] | — | DETAIL=member |
| ⑦ | `attendance-detail-tabs-top10.png` | TC-V-07 | [ ] | — | DETAIL=top10 |
| ⑧ | `attendance-dashboard-mobile.png` | TC-V-08 | [ ] | — | mobile 1 カラム |

## 3. 3 層評価記録（実 capture 後に埋める）

| 層 | 判定（PASS/FAIL） | 根拠 screenshot / test |
| --- | --- | --- |
| Semantic | PASS（機械検証） | focused vitest / typecheck / lint |
| Visual | pending | 8 canonical PNG 未取得 |
| AI UX | pending | 認証済み runtime screenshot で最終目視確認が必要 |

## 4. capture 実行記録（実 capture 後に埋める）

| 項目 | 値 |
| --- | --- |
| 実行日時 | — |
| 実行環境 | staging（user-gated deploy 後） |
| capture script | `apps/web/playwright/tests/...`（実装サイクルで実体化） |
| capture script の finally 句 | `browser.close(); server.close();`（FB-MSO-003 厳守） |
| Playwright 実行ログ | `outputs/phase-11/evidence/playwright-attendance.log`（後続サイクル） |

## 5. 現在の確定事項

- VISUAL タスクであり、8 canonical 名が `screenshot-plan.json` / `phase11-capture-metadata.json` で一致固定済み。
- 実装・focused vitest・typecheck・lint・token gate は実行済み。
- 実 capture・PNG evidence 保存は **未実行**。
- staging deploy / admin bearer mint / 実 capture は **user-gated**。

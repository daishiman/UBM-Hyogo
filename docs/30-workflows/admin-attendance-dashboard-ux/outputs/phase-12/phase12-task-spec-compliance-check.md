# Phase 12 Task Spec Compliance Check

Phase 12 Task 6。root evidence として残す準拠チェック（admin-attendance-dashboard-ux）。canonical 9 見出しは
`phase12-compliance-check-template.md` の `Required Sections`（1..9）に逐語準拠する。

## 1. Summary verdict

総合判定: `implemented_local_runtime_pending / implementation / VISUAL / runtime evidence user-gated`。

本タスクは `apps/web` の出席ダッシュボード UI/UX 是正の **実装仕様書**であり、本改善サイクルで
`apps/web` の CSS / TSX / focused tests を実コードへ反映済みである。focused vitest は PASS。
Phase 11 の local fixture pixel screenshot は取得済み。staging 認証済み pixel screenshot、commit / push / PR は user-gated のため未実行とする。

## 2. Changed-files classification

本 wave のコード差分は `apps/web` と workflow docs に限定される。以下は本改善サイクルで変更済みのファイル分類。

| 分類 | 対象（変更済み / 本 wave で実コード反映） |
| --- | --- |
| apps/web CSS | `apps/web/src/styles/globals.css` |
| apps/web component | `AttendanceZoneDistributionChart.tsx`, `AttendanceTop10Ranking.tsx`, `KpiPanel.tsx`, `AttendanceFilterBar.tsx`, `AttendanceAnalyticsPage.tsx`, `AttendanceAbsenteeAlert.tsx`, `MemberAttendanceTable.tsx`, `SessionAttendanceTable.tsx`（後者 3 件は空状態 `attendance-list-empty` + `data-testid` の additive 付与・AC-5/6） |
| apps/web lib | `apps/web/src/features/admin/attendance/lib/format-attendance.ts` |
| apps/web focused tests | `__tests__/format-attendance.spec.ts`（更新）, `__tests__/AttendanceZoneDistributionChart.spec.tsx`（新規）, `__tests__/KpiPanel.spec.tsx`（更新・既存ファイル） |
| workflow docs（本 wave で作成） | `docs/30-workflows/admin-attendance-dashboard-ux/outputs/phase-12/**`, `unassigned-task-specs/admin-attendance-analytics-calc-correction.md` |
| apps/api | 変更なし（AC-7・不変条件 #1 #5）。`git diff --name-only -- apps/api` は空 |

## 3. `workflow_state` and phase status consistency

| Source | Value |
| --- | --- |
| `index.md` workflow_state | `implemented_local_runtime_pending` |
| `artifacts.json` metadata.workflow_state | `implemented_local_runtime_pending` |
| `artifacts.json` metadata.implementation_status | `implemented_local_runtime_pending` |
| `outputs/artifacts.json` | present（root mirror。metadata / gates を同期） |
| Phase 11 | local_visual_present_staging_pending（local fixture screenshot は present、staging pixel screenshot は user-gated） |
| Phase 12 | completed（strict 7 spec 成果物を実体配置） |
| Phase 13 | pending_user_approval（commit / push / PR / staging 視覚 baseline は user-gated） |

drift なし: workflow root は `implemented_local_runtime_pending`、Phase 11 は local 視覚証跡 present / staging 視覚証跡 pending、Phase 13 は user approval pending で分離されている。

## 4. Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| manual test result | outputs/phase-11/manual-test-result.md | present |
| desktop local screenshot | outputs/phase-11/screenshots/TC-11-1-attendance-layout-desktop.png | present |
| narrow local screenshot | outputs/phase-11/screenshots/TC-11-6-attendance-narrow-mobile.png | present |
| screenshot inventory | outputs/phase-11/screenshot-inventory.json | present |

> `manual-test-result.md` は local focused vitest PASS / local fixture screenshot PASS / apps-api 非変更 / staging screenshot pending を記録する。
> focused vitest と Playwright local screenshot は本改善サイクル内で取得済み。staging screenshot は user-gated runtime evidence のため未生成。

## 5. Phase 12 strict 7 file inventory

| Classification | Path | Status |
| --- | --- | --- |
| Phase 12 本体 | outputs/phase-12/main.md | present |
| Task 1 実装ガイド | outputs/phase-12/implementation-guide.md | present |
| Task 2 仕様更新サマリ | outputs/phase-12/system-spec-update-summary.md | present |
| Task 3 更新履歴 | outputs/phase-12/documentation-changelog.md | present |
| Task 4 未タスク検出 | outputs/phase-12/unassigned-task-detection.md | present |
| Task 5 skill feedback | outputs/phase-12/skill-feedback-report.md | present |
| Task 6 compliance check | outputs/phase-12/phase12-task-spec-compliance-check.md | present |

### implementation-guide.md heading-only reject gate 実測

| Part | 本文行数（非空・見出し除く） | key sections | 判定 |
| --- | --- | --- | --- |
| Part 1: やさしい説明（中学生レベル） | 40 | なぜ必要か / 何が壊れているか / 何をするか（例え話） / やること・やらないこと / 専門用語セルフチェック（6 用語） | PASS（3 行以上 + 例え話 + 用語表 5 件以上） |
| Part 2: 技術詳細（開発者レベル） | 78 | 全体方針 / 変更 10 ファイル Before→After / CSS 配置 / トークン使用例 / ラベル設計 / エッジケース・既知制限 / 検証コマンド | PASS（3 行以上 + 検証コマンド + 既知制限） |

両 Part とも本文 3 行以上かつ必須 key section を充足。見出し存在のみの strict PASS ではない。

## 6. Skill/reference/system spec same-wave sync

| Target | Status |
| --- | --- |
| task-specification-creator Phase 12 strict 7 outputs | done（本 wave で 7 ファイル実体配置） |
| system spec Step 2（新規 interface / API / 型 / 定数） | N/A（UI 表示・CSS・ラベルのみ。詳細は system-spec-update-summary.md） |
| aiworkflow-requirements indexes / LOGS / artifact inventory | done（workflow inventory / quick-reference / resource-map / task-workflow-active / changelog を同 wave 同期） |
| 別タスク分離 spec | `unassigned-task-specs/admin-attendance-analytics-calc-correction.md` 実体存在確認済 |
| skill-feedback routing | SF-1/SF-2/SF-3 を no-op / reject に routing（owning skill 昇格 0 件。理由を skill-feedback-report.md に明記） |

`outputs/artifacts.json` は root `artifacts.json` の mirror として存在する。workflow_state / implementation_status / Gate-B は同期済み。

## 7. Runtime or user-gated boundary

authenticated staging screenshot / staging 視覚 baseline / commit / push / PR は user 明示承認後に行う。
focused vitest と local fixture screenshot は実行済みで PASS。staging runtime artifact を擬似生成せず、local implementation evidence と staging visual evidence を分離する。

## 8. Archive/delete stale-reference gate

| Item | Status |
| --- | --- |
| 削除 / 移動した workflow root | なし（本 wave で root 移動・削除は行わない） |
| 別タスク分離 spec の配置 | `unassigned-task-specs/` に co-locate（親 root 直下）。親が completed-tasks へ移動しても同梱され壊れない |
| stale 参照 | 検出なし。本 wave は新規ファイル作成のみで、live inventory / active workflow / consumed trace の破壊的書き換えなし |
| completed-tasks move | 未実施。Phase 13 は pending_user_approval のまま |

## 9. Four-condition verdict

| Condition | Verdict | Evidence |
| --- | --- | --- |
| 矛盾なし | PASS | `implemented_local_runtime_pending` と「local focused test PASS / local screenshot present / staging visual pending」が index / artifacts / Phase 11 / Phase 12 で整合 |
| 漏れなし | PASS | strict 7 成果物を実体配置（§5）。実コード反映、focused test、未タスク検出 1 件（AC-9）、skill-feedback routing、Step 2 N/A を記録 |
| 整合性あり | PASS | canonical 9 見出しが template `Required Sections` に逐語一致。変更済みファイル・AC・パス・別タスク配置先が phase-1/2/3 と一致 |
| 依存関係整合 | PASS | AC-9 計算是正を `unassigned-task-specs/` へ分離し親子の単方向リンクを維持。`apps/api` 非変更（AC-7）。新 API / D1 schema 依存を追加しない |

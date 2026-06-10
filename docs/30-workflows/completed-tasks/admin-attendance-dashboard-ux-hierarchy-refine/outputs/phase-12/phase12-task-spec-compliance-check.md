# Phase 12 Task Spec Compliance Check

Phase 12 Task 12-6。root evidence として残す準拠チェック（admin-attendance-dashboard-ux-hierarchy-refine）。
canonical 9 見出しは `phase12-compliance-check-template.md` の `Required Sections`（1..9）に**逐語**準拠する。

> 改訂記録（impl-spec-to-skill-sync wave / 2026-06-08）: 初版は `## 1. Task 12-1〜12-6 充足` 等の独自命名で
> CI gate `verify-phase12-compliance` が fail していた（template 警告 L-DEVSYNC-013「独自命名は CI 必ず fail」の実例）。
> 本改訂で canonical 9 見出しへ逐語修正し、`verify:phase12-compliance` を pass させた。

## 1. Summary verdict

総合判定: `implemented_local_checks_pass_visual_capture_pending / implementation / VISUAL / runtime evidence (8 canonical PNG) user-gated`。

本タスクは `/admin/dashboard/attendance` の表現層（`apps/web/src/features/admin/attendance/`）のみを
PRIMARY / TREND / DETAIL の 3 ゾーンへ再構成する **実装仕様書 + 実コード反映**である。focused vitest 8 files / 23 tests・
typecheck・lint・design token gate（HEX 0 件）は本 wave で実行済み PASS。8 canonical screenshot（staging 認証済み
admin capture）は user-gated のため未取得（VIS-1）。commit / push / PR は user 明示承認後（Phase 13 pending）。

## 2. Changed-files classification

本 wave のコード差分は `apps/web` 表現層と workflow docs に限定される。`git status --short` の実測分類は以下。

| 分類 | 対象 |
| --- | --- |
| apps/web component（新規） | `features/admin/attendance/components/AttendanceDetailTabs.tsx`（DETAIL ゾーン Segmented タブホスト） |
| apps/web lib（新規） | `features/admin/attendance/lib/attendance-follow-level.ts`（`attendanceFollowLevel(count)` 純粋関数） |
| apps/web component（修正） | `AttendanceAnalyticsPage.tsx`（3 ゾーン分配）, `KpiPanel.tsx`（PRIMARY hero）, `AttendanceAbsenteeAlert.tsx`（hero 化 + `data-attendance-follow` トーン） |
| apps/web CSS（修正） | `apps/web/src/styles/globals.css`（`.attendance-zone--*` / `.attendance-primary-grid` / `[data-attendance-follow]` 追加・既存リズム調整） |
| apps/web focused tests（新規/追従） | `__tests__/AttendanceDetailTabs.spec.tsx`（新規）, `__tests__/AttendanceAbsenteeAlert.spec.tsx`（新規）, `__tests__/attendance-follow-level.spec.ts`（新規）, `__tests__/KpiPanel.spec.tsx`（追従） |
| workflow docs（本 wave で作成） | `docs/30-workflows/completed-tasks/admin-attendance-dashboard-ux-hierarchy-refine/**` |
| apps/api / packages/shared | 変更なし（AC-7・不変条件 #1 #5）。`git diff --name-only -- apps/api packages/shared` は空（実測確認済み） |

## 3. `workflow_state` and phase status consistency

| Source | Value |
| --- | --- |
| `index.md` 状態 | `implemented_local_checks_pass_visual_capture_pending` |
| `artifacts.json` metadata.workflow_state | `implemented_local_checks_pass_visual_capture_pending` |
| `artifacts.json` metadata.status | `implemented_local_checks_pass_visual_capture_pending` |
| `outputs/artifacts.json` | present（root mirror。metadata / gates を同期） |
| Phase 11 | `pending_visual_capture`（local focused test PASS は present、8 canonical PNG は user-gated staging capture pending） |
| Phase 12 | `completed`（strict 7 成果物を実体配置） |
| Phase 13 | `pending`（commit / push / PR / staging 視覚 baseline は user-gated） |

drift なし: workflow root は `implemented_local_checks_pass_visual_capture_pending`、Phase 11 は local 機械検証 present /
staging 視覚証跡 pending、Phase 13 は user approval pending で分離されている。

## 4. Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| manual test result | outputs/phase-11/manual-test-result.md | present |
| screenshot dashboard full | outputs/phase-11/screenshots/attendance-dashboard-full.png | pending |
| screenshot primary hero (ok) | outputs/phase-11/screenshots/attendance-primary-hero-followup-ok.png | pending |
| screenshot primary hero (warn) | outputs/phase-11/screenshots/attendance-primary-hero-followup-warn.png | pending |
| screenshot trend zone | outputs/phase-11/screenshots/attendance-trend-zone.png | pending |
| screenshot detail tabs (session) | outputs/phase-11/screenshots/attendance-detail-tabs-session.png | pending |
| screenshot detail tabs (member) | outputs/phase-11/screenshots/attendance-detail-tabs-member.png | pending |
| screenshot detail tabs (top10) | outputs/phase-11/screenshots/attendance-detail-tabs-top10.png | pending |
| screenshot dashboard mobile | outputs/phase-11/screenshots/attendance-dashboard-mobile.png | pending |

> `manual-test-result.md`（present）は本 wave で実行した focused vitest 8 files / 23 tests PASS、`verify-design-tokens`
> HEX 0 件 PASS、`apps/web` typecheck PASS を記録する。8 canonical screenshot は user-gated staging capture のため
> `pending`（PNG 実体未生成 → 存在検査対象外）。staging runtime artifact は擬似生成しない。

## 5. Phase 12 strict 7 file inventory

| Classification | Path | Status |
| --- | --- | --- |
| Phase 12 本体 | outputs/phase-12/main.md | present |
| Task 12-1 実装ガイド | outputs/phase-12/implementation-guide.md | present |
| Task 12-2 仕様更新サマリ | outputs/phase-12/system-spec-update-summary.md | present |
| Task 12-3 更新履歴 | outputs/phase-12/documentation-changelog.md | present |
| Task 12-4 未タスク検出 | outputs/phase-12/unassigned-task-detection.md | present |
| Task 12-5 skill feedback | outputs/phase-12/skill-feedback-report.md | present |
| Task 12-6 compliance check | outputs/phase-12/phase12-task-spec-compliance-check.md | present |

### implementation-guide.md heading-only reject gate 実測

| Part | 本文行数（非空・見出し除く） | key sections | 判定 |
| --- | --- | --- | --- |
| Part 1: 中学生レベルの説明 | 19 | なぜ必要か / 何をするか（3 段の例え話） / 大事な約束（変えないこと） | PASS（3 行以上 + 例え話 + 変更しない約束） |
| Part 2: 開発者レベルの説明 | 80+ | 概要 / 変更ファイル一覧 / TS シグネチャ（2 新規 IF） / globals.css クラス表 / テスト / 実行コマンド / エッジケース | PASS（3 行以上 + 検証コマンド + エッジケース） |

両 Part とも本文 3 行以上かつ必須 key section を充足。見出し存在のみの strict PASS ではない。

## 6. Skill/reference/system spec same-wave sync

| Target | Status |
| --- | --- |
| task-specification-creator Phase 12 strict 7 outputs | done（本 wave で 7 ファイル実体配置・canonical 9 見出し準拠へ修正） |
| system spec Step 2（新規 interface / API / 型 / 定数の正本昇格） | N/A（`attendanceFollowLevel` / `AttendanceDetailTabs` は feature ローカル・公開 surface 非昇格。詳細は system-spec-update-summary.md） |
| aiworkflow-requirements indexes / LOGS / quick-reference / resource-map | N/A（新規 skill resource / public spec surface の追加なし。`pnpm indexes:rebuild` 不要） |
| 新規 primitive / design token | 0 件（既存 `Segmented` / `Badge` / `Stat` / `Card` / `AdminSectionCard` のみ・既存 `--ubm-color-*` のみ。AC-5 / AC-6） |
| skill-feedback routing | T-1 / W-1 / D-1 を不採用 2 / 記録のみ 1 に routing（owning skill 昇格 0 件。理由を skill-feedback-report.md に明記） |

`outputs/artifacts.json` は root `artifacts.json` の mirror として存在する。workflow_state / status / gates を同期済み。
本タスクは `apps/api` / `packages/shared` / design token 正本 / primitive catalog のいずれにも新規 surface を追加しないため、
global skill 正本への same-wave sync は **N/A** が正当（feature ローカル UI 改修）。

## 7. Runtime or user-gated boundary

authenticated staging screenshot（8 canonical PNG）/ staging 視覚 baseline / commit / push / PR は user 明示承認後に行う。
focused vitest・typecheck・lint・token gate は local で実行済み PASS。staging runtime artifact を擬似生成せず、
local implementation evidence と staging visual evidence を分離する。capture script は `try { } finally { browser.close(); server.close(); }`
を厳守する（FB-MSO-003）。

## 8. Archive/delete stale-reference gate

| Item | Status |
| --- | --- |
| 削除 / 移動した workflow root | なし（本 wave で root 移動・削除は行わない） |
| stale 参照 | 検出なし。本 wave は新規ファイル作成 + compliance 見出し修正 + artifacts.json gates 追記のみで、live inventory / active workflow / consumed trace の破壊的書き換えなし |
| completed-tasks move | 未実施。Phase 13 は pending のまま（本タスクは active root に留まる） |

## 9. Four-condition verdict

| Condition | Verdict | Evidence |
| --- | --- | --- |
| 矛盾なし | PASS | `implemented_local_checks_pass_visual_capture_pending` と「local focused test PASS / 8 canonical PNG pending / Phase 13 user-gated」が index / artifacts / Phase 11 / Phase 12 で整合 |
| 漏れなし | PASS | strict 7 成果物を実体配置（§5）。実コード反映、focused test 8/23 PASS、未タスク検出（current=VIS-1）、skill-feedback routing、Step 2 N/A を記録 |
| 整合性あり | PASS | canonical 9 見出しが template `Required Sections` に逐語一致。変更済みファイル・AC・パスが phase-01/02/03 と一致。`git diff -- apps/api packages/shared` 空（AC-7） |
| 依存関係整合 | PASS | feature ローカル新規 IF（`attendanceFollowLevel` / `AttendanceDetailTabs`）は公開 surface 非昇格で indexes 再生成不要。新 API / D1 schema 依存を追加しない。OOS-1 / OOS-2 を baseline 候補として分離 |

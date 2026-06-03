# ドキュメント更新履歴 — admin-attendance-dashboard-ux

workflow_state: `implemented_local_runtime_pending` / 生成日: 2026-06-02

本タスクは `implemented_local_runtime_pending` の実装仕様書である。以下は本 wave で作成/更新したドキュメント、
本改善サイクルで変更済みの `apps/web` ファイル一覧、および検証結果を記録する。

## 本 wave で作成した Phase 12 strict 7

| ファイル | 種別 |
| --- | --- |
| `outputs/phase-12/main.md` | 新規 |
| `outputs/phase-12/implementation-guide.md` | 新規 |
| `outputs/phase-12/system-spec-update-summary.md` | 新規 |
| `outputs/phase-12/documentation-changelog.md` | 新規（本ファイル） |
| `outputs/phase-12/unassigned-task-detection.md` | 新規 |
| `outputs/phase-12/skill-feedback-report.md` | 新規 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | 新規 |

## 本改善サイクルで変更済みの実装 13 ファイル（apps/web のみ）

| # | パス | 種別 | AC |
| --- | --- | --- | --- |
| 1 | `apps/web/src/styles/globals.css` | 編集 | AC-1/2/5/6 |
| 2 | `apps/web/src/features/admin/attendance/components/AttendanceZoneDistributionChart.tsx` | 編集 | AC-2/3 |
| 3 | `apps/web/src/features/admin/attendance/components/AttendanceTop10Ranking.tsx` | 編集 | AC-2 |
| 4 | `apps/web/src/features/admin/attendance/components/KpiPanel.tsx` | 編集 | AC-4 |
| 5 | `apps/web/src/features/admin/attendance/components/AttendanceFilterBar.tsx` | 編集 | AC-3/5 |
| 6 | `apps/web/src/features/admin/attendance/components/AttendanceAnalyticsPage.tsx` | 編集 | AC-5 |
| 7 | `apps/web/src/features/admin/attendance/components/AttendanceAbsenteeAlert.tsx` | 編集 | AC-5/6（空状態 `attendance-list-empty` + `data-testid`） |
| 8 | `apps/web/src/features/admin/attendance/components/MemberAttendanceTable.tsx` | 編集 | AC-5/6（空状態 `attendance-list-empty` + `data-testid`） |
| 9 | `apps/web/src/features/admin/attendance/components/SessionAttendanceTable.tsx` | 編集 | AC-5/6（空状態 `attendance-list-empty` + `data-testid`） |
| 10 | `apps/web/src/features/admin/attendance/lib/format-attendance.ts` | 編集 | AC-3 |
| 11 | `apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts` | 更新 | AC-3 |
| 12 | `apps/web/src/features/admin/attendance/__tests__/AttendanceZoneDistributionChart.spec.tsx` | 新規 | AC-2/3 |
| 13 | `apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx` | 更新（既存ファイル） | AC-4 |

> 当初の strict 7 では空状態スタイル適用先を 5 コンポーネントと記していたが、`AttendanceAbsenteeAlert` / `MemberAttendanceTable` / `SessionAttendanceTable` も同 wave で空状態 `attendance-list-empty` クラスと `data-testid` を additive 付与している（AC-5/6 の空状態整備）。skill artifact inventory の Implementation Targets（8 コンポーネント）と整合させ、本表を 13 ファイルへ補正した。Playwright 証跡用の `apps/web/playwright/{fixtures/auth.ts,tests/admin-attendance-dashboard-ux.spec.ts}` は test harness であり実装ファイル数には含めない。

## 別タスク分離記録（AC-9）

- 出席回数帯境界の妥当性・出席率の定義（`attendCount / (totalSessions × totalMembers)`）・延べ vs unique 集計の是正は
  回帰リスクがありユーザー指示により別タスクへ分離。
- 配置先: `unassigned-task-specs/admin-attendance-analytics-calc-correction.md`（apps/api、Issue-ready）。
- 本タスクの UI ラベルは現行境界（`apps/api/src/repository/attendance-analytics.ts:48-53`）に忠実に振るため、両タスクは独立して安全に実装可能。

## 仕様策定中に検出した観察事項（drift 観察 / 非ブロッキング）

| # | 観察 | 実測 | 扱い |
| --- | --- | --- | --- |
| D-1 | vitest 設定パスの drift | `apps/web/vitest.config.ts` は不在。実 SSOT はリポジトリルートの `vitest.config.ts` | `artifacts.json` / phase docs の focused vitest コマンドを `--root=. --config=vitest.config.ts` へ補正し、実行 PASS を確認 |
| D-2 | `KpiPanel.spec.tsx` の「新規」誤記 | 当該ファイルは `apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx` として **既に存在**（`ls` で確認） | 上表 #10 と phase docs を「更新（既存ファイル）」に補正。skill-feedback-report.md に観察として記録 |

## validator 結果（implemented_local_runtime_pending）

| 検証 | 状況 |
| --- | --- |
| focused vitest | PASS: `pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx apps/web/src/features/admin/attendance/__tests__/AttendanceZoneDistributionChart.spec.tsx`（10 tests） |
| `git diff --name-only -- apps/api`（AC-7） | 空（apps/api 非変更） |
| `pnpm verify:phase12-compliance` / `pnpm typecheck` / `pnpm lint` / `pnpm verify:tokens` | 最終検証で実行 |

> local fixture screenshot は `outputs/phase-11/screenshots/` に生成済み。staging screenshot は user-gated runtime artifact のため未生成。
> `outputs/phase-11/manual-test-result.md` は local focused / local screenshot evidence と staging runtime pending 境界の記録として生成済み。

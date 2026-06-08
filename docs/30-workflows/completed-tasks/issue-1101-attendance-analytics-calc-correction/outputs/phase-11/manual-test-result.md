# Phase 11 Manual Test Result — issue-1101-attendance-analytics-calc-correction

workflow_state: `implemented_local_evidence_captured` / updated_at: 2026-06-05T12:57:00+09:00

## Summary

本タスクは出席分析の計算意味論（zone 境界バグ・延べ/unique rate）是正の **実装タスク**である。
現時点の workflow_state は `implemented_local_evidence_captured` であり、実コード差分、focused vitest、local Playwright fixture screenshot は取得済み。
staging 認証済みスクリーンショット・commit / push / PR は user-gated のため未取得。

### 証跡メタ（主ソースの定義）

| 項目 | 内容 |
| --- | --- |
| 主証跡（primary source） | **focused vitest（jsdom / node）** |
| 主証跡の対象 spec | `apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx` / `apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts` / `apps/api/src/repository/__tests__/attendance-analytics-internals.spec.ts` / `apps/api/src/repository/__tests__/attendance-analytics.repository.spec.ts` |
| 副証跡（secondary source） | local Playwright fixture screenshot（取得済み） / staging 認証済みスクリーンショット（user-gated・本サイクル未取得） |
| 取得状況 | 取得済み。root focused 6 files / 21 tests PASS、D1 repository 1 file / 13 tests PASS、local Playwright screenshot 2 PNG present |

### VISUAL だが component test を主証跡とする理由

本タスクの visualEvidence は `VISUAL` に分類されるが、UI 変更は **label 文言（`ZONE_LABEL` / `ZONE_HELP`）と KPI タイル 1 件追加（`attendance-kpi-unique`）に限定**される。
レイアウト・CSS・配色の変更を伴わないため、視覚回帰よりも「ラベル文字列・KPI 値・additive field の consume」を検証する **component test（jsdom）が変更の正しさを最も直接的に立証する**。
したがって主証跡を focused vitest とし、local Playwright fixture screenshot は「画面上の描画破綻がないこと」の補助証跡、staging のピクセルスクリーンショットは実データ描画 baseline（user-gated）として副証跡に置く。

## Gate 一覧

| Gate | Status | Evidence |
| --- | --- | --- |
| Local focused vitest（API/web non-D1） | PASS | `mise exec -- pnpm exec vitest run --root=. apps/api/src/repository/__tests__/attendance-analytics-internals.spec.ts apps/api/src/lib/__tests__/parse-attendance-filter.spec.ts apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx apps/web/src/features/admin/attendance/__tests__/AttendanceZoneDistributionChart.spec.tsx apps/web/src/features/admin/attendance/__tests__/buildExportUrl.spec.ts` → 6 files / 21 tests PASS |
| Local focused vitest（D1 repository） | PASS | `mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts apps/api/src/repository/__tests__/attendance-analytics.repository.spec.ts` → 1 file / 13 tests PASS |
| `pnpm typecheck` | PASS | `mise exec -- pnpm typecheck` → workspace 7/8 projects PASS |
| `pnpm lint` | PASS | `mise exec -- pnpm lint` → dependency-cruiser / stable key / no-inline-style / workspace lint PASS |
| D1 migration / endpoint 差分ゼロ（AC-8） | PASS | `git diff --name-only -- apps/api/migrations apps/api/src/routes` が空 |
| 旧矢印 enum 残存ゼロ（AC-2） | PASS_BOUNDARY | 旧矢印値は別ドメインと互換マッピングだけに限定。`AttendanceZoneZ` / web label / API zone output からは除去済み |
| Local Playwright screenshot | PASS | `apps/web/playwright/tests/issue-1101-attendance-analytics-calc-correction.spec.ts` → `outputs/phase-11/screenshots/TC-11-issue1101-attendance-analytics-desktop.png` / `...-mobile.png` と `screenshot-inventory.json` を保存 |
| Staging 認証済みスクリーンショット | PENDING_USER_GATED | staging deploy / 認証描画は user 明示承認後に取得 |

## Visual Runtime Boundary

label 変更と unique KPI タイル追加（`attendance-kpi-unique`）の正しさは jsdom 上の component test を主証跡で立証する。
local Playwright fixture では mock API から `uniqueAttendeeCount=24` / `uniqueAttendanceRate=0.8` と新 zone key distribution を返し、desktop/mobile の画面 PNG を保存する。
staging 認証済み描画は user-gated runtime evidence として `phase-11-manual-test.md` が追跡する。
本サイクルでは staging runtime artifact を擬似生成せず、local fixture 証跡と staging visual 証跡（user-gated）を明確に分離する。

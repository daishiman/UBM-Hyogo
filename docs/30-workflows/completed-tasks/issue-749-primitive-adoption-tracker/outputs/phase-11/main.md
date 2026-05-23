# Phase 11: Evidence Capture — Issue #749 Primitive Adoption

更新日: 2026-05-17
状態: `local_evidence_captured_visual_runtime_pending`

## サマリ

| Gate | コマンド | exit | log |
| --- | --- | --- | --- |
| grep gate (C1-C6) | `bash scripts/verify-primitive-adoption.sh` | 0 | `evidence/grep-gate.log` |
| typecheck (web) | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | 0 | `evidence/typecheck.log` |
| focused tests | `pnpm exec vitest run --config vitest.config.ts ...` | 0 | `evidence/spec.log` |
| primitive visual harness | `PLAYWRIGHT_EVIDENCE_DIR=... pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/ui-primitives-visual.spec.ts --project=desktop-chromium` | 0 | `evidence/visual/screenshots/`, `evidence/visual/axe-report.json` |
| parallel-09 primitive visual harness | `pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/visual/parallel-09-primitives.spec.ts --project=visual-chromium` | 0 | `evidence/visual/parallel09-screenshots/` |

## 採用 matrix 実測値

`outputs/adoption-tracker.md` 参照。19 routes x 6 primitive 全セルが `O` または `-`、`X` 0 件。

## 検証範囲

- C1: raw `<input>` 直接利用 0 件（admin 5 panel + DensityToggle）
- C2: mutating admin panel 4 件が `useAdminMutation().trigger()` を実使用
- C3: 8 admin route page が Breadcrumb を直接または `AdminPageHeader` 経由で描画
- C4: legacy `@/lib/useAdminMutation` 参照 0 件
- C5: admin empty-result surface が `EmptyState` を描画
- C6: paged admin surface が `Pagination` を描画

## VISUAL 証跡

local primitive visual evidence は取得済み。

- `evidence/visual/screenshots/`: FormField / Input / EmptyState など 37 screenshot + axe report
- `evidence/visual/parallel09-screenshots/`: FormField / Icon / Breadcrumb / focus-visible / Pagination / EmptyState の 1x / 2x screenshot

authenticated admin route screenshot / staging smoke は Phase 13 以降の user-gated runtime evidence として残す。

## 未解消事項

なし。未タスク化は不要。

# Phase 11 Runtime Evidence

## 概要

本サイクルでは local 実装 + contract/unit test まで完了。staging deploy / Playwright visual baseline / screenshot 取得はユーザー判断（"staging 検証はスキップ"）により未実施。

## 取得済み evidence

| 種別 | コマンド | 結果 |
|------|---------|------|
| API unit/contract test | `pnpm --filter @ubm-hyogo/api test` | 419 tests green |
| Web unit test | `pnpm --filter @ubm-hyogo/web test` | 1156 tests green（新規 15 ケース含む） |
| Shared schema test | `pnpm --filter @ubm-hyogo/shared test` | 231 tests green |
| Typecheck | `pnpm typecheck` | green（api/web/shared） |
| Lint | `pnpm lint` | green |
| Build | `pnpm build` | green |

新規追加 unit/contract test（15 ケース）:

- `apps/api/src/lib/__tests__/csv-export.spec.ts`（3）
- `apps/api/src/lib/__tests__/parse-attendance-filter.spec.ts`（4）
- `apps/api/src/repository/__tests__/attendance-analytics-internals.spec.ts`（5）
- `apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts`（5）
- `apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx`（3）
- `apps/web/src/features/admin/attendance/__tests__/AttendanceTrendChart.spec.tsx`（2）
- `apps/web/src/features/admin/attendance/__tests__/buildExportUrl.spec.ts`（2）

## 未取得 evidence（user-gated）

| 項目 | 理由 |
|------|------|
| staging URL での 404 RCA 再現 | staging deploy をスキップ |
| Playwright visual baseline（4 screen × chromium） | browser/staging 未起動 |
| /admin/dashboard/attendance 実機 screenshot | browser 未起動 |
| CSV export download verification | runtime 未起動 |
| Lighthouse / a11y axe | runtime 未起動 |

## 次サイクル想定

1. `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` 等で staging 反映。
2. `pnpm --filter @ubm-hyogo/web playwright test admin-attendance` で baseline 生成。
3. `outputs/phase-11/screenshots/` 配下に PNG を配置し本 evidence note を update。

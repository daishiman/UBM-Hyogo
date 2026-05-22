# Phase 9: 静的検証

## 結果
| gate | command | 結果 |
|------|---------|------|
| typecheck | `pnpm -F @ubm-hyogo/web typecheck` | ✅ pass |
| lint | `pnpm -F @ubm-hyogo/web lint` (tsc + eslint) | ✅ pass |
| test | `pnpm -F @ubm-hyogo/web test` | ✅ 541 pass / 5 todo / 1 skip |
| build | `pnpm -F @ubm-hyogo/web build` (`next build --webpack`) | ✅ 27 routes |
| design-tokens | `grep -E 'bg-\[#\|text-\[#\|border-\[#' apps/web/src/features/admin apps/web/app/(admin)` | ✅ 0 件 |

## 修正履歴
- `admin-dashboard-ui.ts`: optional → `T \| undefined`（exactOptionalPropertyTypes 対応）
- `Zone/StatusDistribution.tsx`: 同上
- `MembersTable.tsx`: `consent === "yes"` 比較を削除（実 enum は `consented` / `declined` / `unknown`）
- `MembersTable.test.tsx`: brand 化（`asMemberId` / `asResponseEmail`）, `publicConsent: "consented"`

## 判定
- 全 gate green。Phase 10 進行可。

# Phase 9: 品質保証結果

実行日: 2026-05-10

| # | 項目 | command | 結果 |
|---|------|--------|------|
| Q-01 | typecheck | `mise exec -- pnpm -F @ubm-hyogo/web typecheck` | **PASS** (0 errors) |
| Q-02 | lint | `mise exec -- pnpm -F @ubm-hyogo/web lint` | **PASS** (0 errors / 0 warnings) |
| Q-03 | unit + a11y test | `pnpm -F @ubm-hyogo/web test --run <4 focused files>` | **PASS** (516 passed / 1 skipped) |
| Q-04 | OKLch tokens | `mise exec -- pnpm -F @ubm-hyogo/web verify-design-tokens` | **PASS** (9/9 tests) |
| Q-05 | build (OpenNext Workers webpack) | `pnpm -F @ubm-hyogo/web build` | NOT_RUN (本 phase で skip。task-18 で smoke 実施想定) |
| Q-06 | grep guard: HEX 直書き | `grep -RnE "#[0-9a-fA-F]{3,8}\b" apps/web/src/components/admin apps/web/app/\(admin\)/admin/{schema,identity-conflicts,audit}` | **PASS** (0 件) |
| Q-07 | grep guard: `process.env.*` 直接参照 | 同上 path | **PASS** (0 件) |
| Q-08 | grep guard: 焼き込み URL | 同上 path | **PASS** (0 件) |
| Q-09 | apps/api 不変 | `git diff origin/dev...HEAD -- apps/api/` | **PASS** (0 行) |
| Q-10 | canonical import 整合 | route pages が `apps/web/src/components/admin/*` / `apps/web/src/lib/admin/*` を参照 | **PASS** |

## Q-05 補足

`pnpm -F @ubm-hyogo/web build` (OpenNext Workers webpack) は本タスクの contract hardening スコープ外で task-18 (regression smoke) に委譲。本 task では typecheck / lint / unit test / verify-design-tokens で十分。

## 結論

Q-01〜Q-04, Q-06〜Q-10 すべて PASS。Q-05 は task-18 委譲。MAJOR / BLOCKING 0 件。

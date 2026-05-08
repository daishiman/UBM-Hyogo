# Phase 9: 品質保証（typecheck / lint / unit test）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 / 13 |
| Source | `outputs/phase-9/phase-9.md` |
| 状態 | completed |

## 目的

local PASS 5 点セット（typecheck / lint / test / build / grep-gate）を確定し evidence を収集する。

## 実行タスク

- `mise exec -- pnpm typecheck`
- `mise exec -- pnpm lint`
- `node --test scripts/__tests__/patch-next-standalone-instrumentation.test.mjs`
- `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare`（standalone 出力 + patch 起動の通し確認）
- grep-gate:
  - `grep -RIn "process.env.SENTRY_DSN" apps/web/src` が 0 件（task-03 の grep gate と整合）
  - `grep -RIn "127.0.0.1:8888" apps/web/src` が 0 件
  - patch script に DSN / token 文字列が混入していないこと

## 参照資料

- `outputs/phase-6/phase-6.md`
- `outputs/phase-8/phase-8.md`

## 成果物

- `outputs/phase-9/phase-9.md`
- `outputs/phase-11/evidence/typecheck.log`
- `outputs/phase-11/evidence/lint.log`
- `outputs/phase-11/evidence/test.log`
- `outputs/phase-11/evidence/build.log`
- `outputs/phase-11/evidence/grep-gate.log`

## 完了条件

- local PASS 5 点が全て PASS
- evidence ファイルが canonical path に配置済（Phase 11 で参照）

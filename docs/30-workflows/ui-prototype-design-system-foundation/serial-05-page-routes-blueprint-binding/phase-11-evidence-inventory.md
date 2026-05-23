---
phase: 11
title: Evidence inventory — 物理生成 artifact 一覧
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-05-page-routes-blueprint-binding
status: draft
---

# Phase 11 — Evidence inventory

[実装区分: 実装仕様書]

## 1. evidence 配置ルート

```
docs/30-workflows/ui-prototype-design-system-foundation/serial-05-page-routes-blueprint-binding/outputs/
├── phase-11/
│   ├── playwright-smoke.json
│   ├── verify-design-tokens.log
│   ├── typecheck.log
│   ├── lint.log
│   ├── build.log
│   ├── adapter-unit.log
│   ├── grep-gates.log
│   ├── grep-gate-results.md
│   ├── routes-inventory.md
│   └── screenshots/        # serial-05 では未使用。4 screens は serial-07 側へ集約
```

Phase 12 strict 7 は parent workflow root
`docs/30-workflows/ui-prototype-design-system-foundation/outputs/phase-12/`
に集約する。sub-workflow 配下に `outputs/phase-12/{main,implementation-guide,...}` を複製しない。

## 2. evidence 表（Phase 11 必須 inventory）

| # | path | 生成コマンド | 検証 |
|---|------|--------------|------|
| E-1 | `outputs/phase-11/playwright-smoke.json` | `playwright test playwright/smoke --reporter=json` | 19 routes 全件 status=passed |
| E-2 | `outputs/phase-11/verify-design-tokens.log` | `pnpm verify:design-tokens` | HEX 0 件、exit 0 |
| E-3 | `outputs/phase-11/typecheck.log` | `pnpm typecheck 2>&1 \| tee ...` | error 0 件 |
| E-4 | `outputs/phase-11/lint.log` | `pnpm lint 2>&1 \| tee ...` | error 0 件 |
| E-5 | `outputs/phase-11/build.log` | `pnpm --filter @ubm-hyogo/web build 2>&1 \| tee ...` | exit 0 |
| E-6 | `outputs/phase-11/adapter-unit.log` | `pnpm --filter @ubm-hyogo/web test src/lib/adapters` | 全 spec passed |
| E-7 | `outputs/phase-11/grep-gates.log` | Phase 10 §2.2 のコマンド束 | 全 G-* が OK |
| E-8 | `serial-07-regression-evidence/outputs/phase-11/screenshots/top.png` | playwright visual `top.spec.ts` | serial-07 で物理存在化（baseline は SW-07） |
| E-9 | `serial-07-regression-evidence/outputs/phase-11/screenshots/members-list.png` | 同上 | serial-07 で物理存在化 |
| E-10 | `serial-07-regression-evidence/outputs/phase-11/screenshots/member-detail.png` | 同上 | serial-07 で物理存在化 |
| E-11 | `serial-07-regression-evidence/outputs/phase-11/screenshots/admin-dashboard.png` | 同上 | serial-07 で物理存在化 |
| E-12 | `outputs/phase-11/routes-inventory.md` | 手書き — 19 routes と blueprint 行範囲の照合表 | 19 行存在 |
| E-13 | `outputs/phase-11/grep-gate-results.md` | 手書き — G-1/fallback/static gate summary | marker 全件存在 |

## 3. evidence existence validator 連携

phase11 evidence existence validator（Issue #730 系）に `serial-05` の inventory を登録する。`parse-phase11-evidence` が認識する prefix:

- `outputs/phase-11/*.log`
- `outputs/phase-11/*.json`
- `serial-07-regression-evidence/outputs/phase-11/screenshots/*.png`（4 screens runtime visual）

`routes-inventory.md` は markdown 形式で 19 行表を持ち、各行に `route | blueprint | page.tsx path | status` を含む。

## 4. Phase 11 evidence file inventory

phase11 evidence existence validator に渡す inventory は、`status=present` の物理ファイルだけを検査対象にする。`pending` は SW-07 の runtime visual や user-gated evidence を台帳化するだけで PASS 判定に使わない。

| Path | Status | Validator scope | Owner |
|------|--------|-----------------|-------|
| `outputs/phase-11/typecheck.log` | present | file exists | serial-05 |
| `outputs/phase-11/lint.log` | present | file exists | serial-05 |
| `outputs/phase-11/build.log` | present | file exists | serial-05 |
| `outputs/phase-11/adapter-unit.log` | present | file exists | serial-05 |
| `outputs/phase-11/grep-gates.log` | present | file exists | serial-05 |
| `outputs/phase-11/grep-gate-results.md` | present | file exists | serial-05 |
| `outputs/phase-11/routes-inventory.md` | present | file exists + 19 route rows | serial-05 |
| `outputs/phase-11/playwright-smoke.json` | pending | ledger only | serial-05 execution |
| `outputs/phase-11/verify-design-tokens.log` | present | file exists | serial-05 |
| `serial-07-regression-evidence/outputs/phase-11/screenshots/top.png` | pending | ledger only | serial-07 |
| `serial-07-regression-evidence/outputs/phase-11/screenshots/members-list.png` | pending | ledger only | serial-07 |
| `serial-07-regression-evidence/outputs/phase-11/screenshots/member-detail.png` | pending | ledger only | serial-07 |
| `serial-07-regression-evidence/outputs/phase-11/screenshots/admin-dashboard.png` | pending | ledger only | serial-07 |

## 5. evidence の不変条件

- evidence は **物理ファイル** として存在（`outputs/phase-11/`）
- path traversal を含まない（`..` を path に含めない）
- CI artifact ではなく Git 管理外でも可。ただし PR 本文で参照する path は repo 相対
- 古い evidence は SW 完了時に `outputs/phase-11/_archive/` へ移動

## 6. recovery workflow / since-filter 親和性

`since-filter` が `D'+0 reset` を判定するために、各 evidence は生成時刻を file mtime で保持する。本 SW では evidence 生成スクリプトを別途増やさず、Phase 10 のコマンドの実行時刻が mtime となる。

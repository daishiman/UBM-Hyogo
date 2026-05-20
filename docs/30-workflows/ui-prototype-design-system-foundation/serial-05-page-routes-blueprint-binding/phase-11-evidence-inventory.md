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
│   └── screenshots/        # SW-07 と統合（4 screens の保存先）
│       ├── top.png
│       ├── members-list.png
│       ├── member-detail.png
│       └── admin-dashboard.png
└── phase-12/
    └── implementation-guide.md
```

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
| E-8 | `outputs/phase-11/screenshots/top.png` | playwright visual `top.spec.ts` | 物理存在（baseline は SW-07） |
| E-9 | `outputs/phase-11/screenshots/members-list.png` | 同上 | 物理存在 |
| E-10 | `outputs/phase-11/screenshots/member-detail.png` | 同上 | 物理存在 |
| E-11 | `outputs/phase-11/screenshots/admin-dashboard.png` | 同上 | 物理存在 |
| E-12 | `outputs/phase-11/routes-inventory.md` | 手書き — 19 routes と blueprint 行範囲の照合表 | 19 行存在 |

## 3. evidence existence validator 連携

phase11 evidence existence validator（Issue #730 系）に `serial-05` の inventory を登録する。`parse-phase11-evidence` が認識する prefix:

- `outputs/phase-11/*.log`
- `outputs/phase-11/*.json`
- `outputs/phase-11/screenshots/*.png`

`routes-inventory.md` は markdown 形式で 19 行表を持ち、各行に `route | blueprint | page.tsx path | status` を含む。

## 4. evidence の不変条件

- evidence は **物理ファイル** として存在（`outputs/phase-11/`）
- path traversal を含まない（`..` を path に含めない）
- CI artifact ではなく Git 管理外でも可。ただし PR 本文で参照する path は repo 相対
- 古い evidence は SW 完了時に `outputs/phase-11/_archive/` へ移動

## 5. recovery workflow / since-filter 親和性

`since-filter` が `D'+0 reset` を判定するために、各 evidence は生成時刻を file mtime で保持する。本 SW では evidence 生成スクリプトを別途増やさず、Phase 10 のコマンドの実行時刻が mtime となる。

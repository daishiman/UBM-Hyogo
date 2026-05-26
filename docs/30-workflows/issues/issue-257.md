# [#257] [U-3] Vitest workspace 移行（per-package config 統一）

## メタ情報

```yaml
issue_number: 257
title: [U-3] Vitest workspace 移行（per-package config 統一）
state: OPEN
priority: 低
scale: 中規模
category: リファクタリング
status: 未実施
created_date: 2026-04-29
updated_date: 2026-04-29
url: https://github.com/daishiman/UBM-Hyogo/issues/257
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | 中規模 |
| ステータス | 未実施 |

---

## 概要

coverage-80-enforcement で採用した単一 root `vitest.config.ts` + multi-include を、vitest workspace 機能で各 package config に分離する。root は workspace 集約と coverage 共通設定のみに役割を絞る。

## 背景・課題

- root config に jsdom / node / edge runtime の environment 差が散在
- package 固有 setup（D1 binding mock, MSW, edge runtime stub）の出し分けが煩雑
- per-package coverage threshold オーバーライドが効きにくい

## 苦戦箇所

vitest workspace は package 別 config を分離できる一方、coverage の集約方法（per-package summary を root が再集計するか、workspace runner が単一 summary を生成するか）の挙動が version 依存で変わる。`coverage-guard.sh` は package 単位の `coverage/coverage-summary.json` を前提とするため、workspace 化で path や reporter 出力場所が変わると pipeline が破綻する。移行 PR は coverage-guard と必ずセットで smoke 必須。

## 受入条件 (AC)

1. `vitest.workspace.ts` を root に追加
2. `apps/web` / `apps/api` / `packages/*` 各 package に `vitest.config.ts` 分離
3. 一律 80% threshold は workspace 共通設定から継承、package 別 drift なし
4. `pnpm -r test:coverage` と root `pnpm test:coverage` が同一 summary を生成
5. coverage-guard.sh は移行後も I/O 互換

## 起動条件

coverage-80-enforcement PR③ merge 済み（hard gate 安定後）。

## 参照

- 仕様書: `docs/30-workflows/unassigned-task/task-vitest-workspace-migration-001.md`
- 検出ログ: `docs/30-workflows/coverage-80-enforcement/outputs/phase-12/unassigned-task-detection.md` の U-3

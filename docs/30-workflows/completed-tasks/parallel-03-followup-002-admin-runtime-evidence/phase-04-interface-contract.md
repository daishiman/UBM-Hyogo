---
phase: 4
title: テスト作成 — admin shell scrape spec の契約定義
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-03-followup-002-admin-runtime-evidence
status: spec_created
taskType: implementation
visualEvidence: NON_VISUAL
implementation_mode: verify_existing
---

# Phase 4 — テスト作成（targeted test 設計）

[実装区分: 実装仕様書]

> `implementation_mode: verify_existing` のため、Phase 4 は「既実装の data-* 契約を runtime で確認する targeted test（= scrape spec）」を設計する。production code への TDD RED は行わない。テスト操作対象は外部 props でも internal state でもなく、**SSR された DOM 文字列**である。

## 1. 追加するテストファイル

| ファイル | 種別 | 命名 |
|----------|------|------|
| `apps/web/playwright/tests/parallel-03-admin-shell-scrape.spec.ts` | Playwright e2e（scrape + assert + evidence write） | `*.spec.ts`（不変条件#8 準拠） |

## 2. spec の契約（関数・処理シグネチャ）

```ts
import { test, expect } from '../fixtures/auth'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

// 親 parallel-03 outputs（EV-12 canonical path）。apps/web cwd 起点の相対。
const EV12_PATH =
  '../../docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11/dom-scrape-admin.txt'

// data-* 契約属性のみ抽出する grep 相当（current code の実属性に最適化）
const CONTRACT_ATTR = /data-(theme|route-group|shell|route|testid)="[^"]*"/g

function extractContractLines(html: string): string[] { /* match → unique → sort */ }
```

## 3. テストケース（expected result）

| ID | ケース | 操作 | 期待値 |
|----|--------|------|--------|
| TC-01 | admin shell が SSR される | `adminPage.goto('/admin')` → `waitForSelector('[data-testid="admin-shell"]')` | selector が attached |
| TC-02 | data-theme 契約 | `page.content()` を grep | `data-theme="cool"` を含む |
| TC-03 | data-route-group 契約 | 同上 | `data-route-group="admin"` を含む |
| TC-04 | data-route 契約 | 同上 | `data-route="admin"` を含む |
| TC-05 | data-shell 契約（topbar/sidebar） | 同上 | `data-shell="sidebar"` と `data-shell="topbar"` を各含む |
| TC-06 | data-testid 契約 | 同上 | `data-testid="admin-shell"` を含む |
| TC-07 | HEX 直書き非混入（OKLch 維持の sanity） | 抽出行を検査 | `#[0-9a-fA-F]{3,6}` を**含まない**（契約属性行に限る） |
| TC-08 | evidence ファイル書き出し | `writeFile(EV12_PATH, lines.join('\n'))` | ファイルが non-empty で生成される |

> TC-02..06 が grep 0 hit の場合は **contract regression** として fail（親 phase-11 §4.4 の意味論）。

## 4. RED 前の命名規則整合チェック

- spec ファイル名 `parallel-03-admin-shell-scrape.spec.ts` は `apps/web/playwright/tests/` の既存命名（kebab-case + `.spec.ts`）と一致。
- 抽出属性名は `apps/web/app/(admin)/layout.tsx` の実属性（Phase 1 §1.2 表）と 1:1 一致。手書き推測ではなく実コードから引用すること。

## 5. テスト実行前チェック（[FB-MSO-002]）

```bash
mise exec -- pnpm install            # esbuild darwin バイナリ整合（worktree 直後）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright --version
```

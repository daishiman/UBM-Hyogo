---
phase: 8
title: リファクタリング & DoD — 重複削減と完了条件確定
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-03-followup-002-admin-runtime-evidence
status: spec_created
taskType: implementation
visualEvidence: NON_VISUAL
implementation_mode: verify_existing
---

# Phase 8 — リファクタリング & Definition of Done

[実装区分: 実装仕様書]

## 1. リファクタリング（対象/Before/After/理由）

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| EV-12 取得手順 | `curl -b cookies.txt ...`（手動 cookie 前提・旧記述） | Playwright `adminPage` fixture 経由 spec | 既存 fixture 再利用で再現性・CI 親和性を確保 |
| grep パターン | `data-(theme\|shell\|route)=`（`data-shell="appshell"` 想定の旧パターン） | `data-(theme\|route-group\|shell\|route\|testid)=` | current code 実属性に整合 |
| status 語彙 | `captured`（validator invalid） | `present`（validator valid） | gate fail 回避 |

> navigation drift なし（新規導線追加なし）。重複 spec なし（screenshot/gate は既存 spec に委譲）。

## 2. Definition of Done（完了条件）

| ID | 完了条件 | 検証手段 |
|----|----------|----------|
| DoD-1 | `parallel-03-admin-shell-scrape.spec.ts` が全 TC pass | `pnpm exec playwright test ...` |
| DoD-2 | `dom-scrape-admin.txt` が親 outputs/phase-11 に存在し non-empty | `test -s .../dom-scrape-admin.txt` |
| DoD-3 | evidence が `data-theme="cool"` / `data-route-group="admin"` / `data-route="admin"` / `data-shell=` / `data-testid="admin-shell"` を含む | `grep` |
| DoD-4 | 親 `phase-11-evidence-inventory.md` の EV-12 Status=`present`、取得手順が current grep へ最適化済み | 目視 + diff |
| DoD-5 | 親台帳に EV-13/15/16 の委譲先・理由が明記済み（status は `pending` のまま） | 目視 |
| DoD-6 | `mise exec -- pnpm verify:phase12-compliance` が 0 fail | コマンド実行 |
| DoD-7 | `mise exec -- pnpm typecheck` / `pnpm lint` が pass | コマンド実行 |
| DoD-8 | 4 不変条件遵守（既存 API / OKLch / プロトタイプ正本 / D1 直接アクセス禁止） | TC-07 + scrape 内容クロスチェック |

## 3. ローカル実行・検証コマンド（一括）

```bash
# 1) 依存整合
mise exec -- pnpm install
# 2) scrape spec 実行（evidence 生成）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/parallel-03-admin-shell-scrape.spec.ts --project=desktop-chromium
# 3) evidence 検証
test -s docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11/dom-scrape-admin.txt
grep -E 'data-(theme|route-group|route|shell|testid)=' docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11/dom-scrape-admin.txt
# 4) gate / 型 / lint
mise exec -- pnpm verify:phase12-compliance
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

---
phase: 7
title: カバレッジ
workflow_id: issue-880-public-segment-error-loading-boundary
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
---

# Phase 7 — カバレッジ

[実装区分: 実装仕様書]

## 1. 期待カバレッジ

| File | カバレッジ手段 | 期待値 |
|------|---------------|--------|
| `apps/web/app/(public)/error.tsx` | Playwright TC-01 + TC-02 | DOM contract + focus contract + import paths が解決すること |
| `apps/web/app/(public)/loading.tsx` | 静的 markup（Playwright visual 任意） | DOM contract のみ |
| `apps/web/app/(public)/error-boundary-smoke/page.tsx` | Playwright TC-01 によって route 解決される | 100% (throw 経路のみ) |

## 2. Vitest coverage への影響

本 task は Playwright スコープのため Vitest coverage の数値変動は **想定なし**。`pnpm coverage-guard --changed` が走る場合は changed file 集合に追加されるが、Vitest 対象でない `.tsx` (app router) のため除外される。

## 3. Coverage guard gate

| Gate | 結果 |
|------|------|
| `scripts/coverage-guard.sh --changed` | 影響なし（Vitest 対象外ファイル群） |
| `verify-design-tokens` grep | 新規 2 ファイル pass |

## 4. 未カバー領域と判断

| 領域 | カバレッジ | 判断 |
|------|-----------|------|
| `error.tsx` の `isDev` 分岐 | dev のみ | dev tooling 用なので production coverage 不要 |
| `error.tsx` の `error.digest` 有無分岐 | digest あり経路のみ | 既存 root error.tsx と同パターンで割愛 |
| `error-boundary-smoke` の production NODE_ENV ガード | unit 検証なし | manual safety check で代替（Phase 11 で grep evidence 取得） |

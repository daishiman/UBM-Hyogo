# Phase 10 — 最終レビュー

`[実装区分: 実装仕様書]`

## 1. AC 達成判定

| AC | 達成手段 | 判定 |
|----|---------|------|
| AC-1 計測スクリプト | `scripts/measure-coverage-exclude-ratio.ts` + Phase 7 baseline 出力 | 判定対象 |
| AC-2 PR comment soft warn | `.github/workflows/verify-coverage-exclude-ratio.yml` | 判定対象 |
| AC-3 fallback runbook | `docs/30-workflows/runbooks/e2e-coverage-fallback-metric.md` | 判定対象 |
| AC-4 SLA runbook | `docs/30-workflows/runbooks/playwright-smoke-19-route-sla.md` | 判定対象 |
| AC-5 exclude 縮小 + unit test | `vitest.config.ts` 編集 + 既存 `apps/web/app/__tests__/error.component.spec.tsx` の Loading / NotFound regression | 判定対象 |

## 2. MINOR 検出 → unassigned task 起票判断

| MINOR 候補 | 対応 |
|-----------|------|
| `verify-coverage-exclude-ratio` を required check に昇格 | unassigned 起票候補 |
| `error.tsx` の exclude 解除 (Phase 3 で scope out) | unassigned 起票候補 |
| `page.tsx` / `layout.tsx` の testable 部分の library 化 (long-term) | unassigned 起票候補 |

## 3. judge

→ 全 DoD GREEN なら Phase 11 進行可。

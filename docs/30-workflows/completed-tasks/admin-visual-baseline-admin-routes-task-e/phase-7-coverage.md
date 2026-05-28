---
spec_classification: implementation_spec
state: implemented_local_runtime_pending
phase: 7
phase_name: カバレッジ
created_at: 2026-05-27
---

# Phase 7: カバレッジ

[実装区分: 実装仕様書]

## 1. カバレッジ計測スコープ

本タスクは **カバレッジ計測スコープ外**。

理由:
- Playwright visual baseline spec は E2E レイヤであり、vitest line/branch coverage（issue-255 で同期する 3 source）の対象に含まれない。
- `_helpers.ts` は Playwright Page 依存の thin wrapper であり、unit test 対象としても計測しない。

## 2. coverage threshold への影響

- `pnpm test:coverage` の line/branch/statement/function 数値には影響しない。
- `codecov.yml` / `vitest.config.ts` / `.github/workflows/coverage.yml` の 3 source 同期にも変更なし。

## 3. CI gate

- `coverage-guard` push hook はスキップ条件に該当しない（spec 追加なので test fail がなければ通る）。
- `verify-design-tokens` には影響なし。

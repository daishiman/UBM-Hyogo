---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 7
phase_name: カバレッジ
created_at: 2026-05-29
---

# Phase 7: カバレッジ

[実装区分: 実装仕様書]

## 1. カバレッジ計測スコープ

本タスクは **vitest line/branch coverage の計測スコープ外**。

理由:

- 追加するのは Playwright E2E（smoke）/ visual baseline spec であり、E2E レイヤは vitest の line/branch/statement/function coverage（issue-255 で同期する 3 source）の対象に含まれない。
- `_helpers.ts` は Playwright `Page` 依存の thin wrapper であり、unit coverage の計測対象としても扱わない（Phase 6 §2）。
- 本 spec はアプリ実装ソース（`apps/web/src/`）を一切変更しないため、計測対象ソースの差分が無い。

> 参考: Playwright 実行時の monocart-reporter は `apps/web/src/` の v8 coverage を別途収集するが、
> これは E2E カバレッジ可視化用であり、vitest coverage threshold gate とは別系統。Task F の spec 追加は
> vitest threshold の母数を動かさない。

---

## 2. coverage threshold への影響

- `pnpm test:coverage` の line / branch / statement / function 数値に影響なし。
- `codecov.yml` / `vitest.config.ts` / `.github/workflows/coverage.yml` の 3 source 同期（issue-255）に変更なし。

---

## 3. CI gate

| gate | 影響 | 補足 |
|------|------|------|
| `coverage-guard`（pre-push hook / `scripts/coverage-guard.sh`） | スキップ条件に非該当だが、spec 追加のみで test fail が無ければ通過 | アプリソース差分が無いため `--changed` モードでも coverage 低下を起こさない |
| `verify-design-tokens`（task-18） | 影響なし | 本 spec は CSS / token を変更しない。Phase 4 §4 の regression dry-run で `tokens.css` を一時改変するのは検証用で commit しない（gate には乗らない） |
| `verify-test-suffix`（GitHub Actions）/ lefthook `block-test-suffix` | 通過 | 追加 spec は `*.spec.ts` のみ（`.test.ts` 不使用 / 不変条件 #3） |

design-tokens は Task F では「regression dry-run の対象 token」としてのみ参照し、本 spec 自体は OKLch token / CSS を変更しない。

# Phase 11 — 手動テスト

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`

## 1. 概要

本 spec は CI regression guard のため、E2E スクリーンショットは不要（`visualEvidence: NON_VISUAL`）。代わりに focused Vitest を実行し、4 件の構造 assertion が OpenNext Workers invariant を検出することを確認する。

## 2. 手順

### 2.1 緑化 baseline

```bash
pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/__tests__/opennext-config-regression.spec.ts
# 期待: 4 pass / 0 fail
```

### 2.2 assertion review

| AC | assertion |
| --- | --- |
| AC1 | `pages_build_output_dir` 不在、`main = ".open-next/worker.js"`、`compatibility_flags = ["nodejs_compat"]` |
| AC2 | `[assets]` / `[env.staging.assets]` / `[env.production.assets]` の `directory` / `binding` / `not_found_handling` |
| AC3 | `deploy` / `deploy:staging` / `deploy:production` script 不在 |
| AC4 | `.assetsignore` required lines |

## 3. evidence 出力

`outputs/phase-11/manual-test-result.md` に focused Vitest 実行コマンドと PASS 結果を記録する。

## 4. CI 検証

PR 作成後、GitHub Actions の workflow run で本 step（または `__tests__` 配下の vitest 全実行）に当該 spec が含まれることを確認しスクリーンショット or run URL を記録する。

## 5. DoD

- baseline 4 pass の evidence が揃う
- `git status` / `git diff --stat` 確認済み
- CI run URL 記録

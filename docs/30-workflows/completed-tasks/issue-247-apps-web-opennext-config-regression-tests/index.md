---
workflow_id: issue-247-apps-web-opennext-config-regression-tests
issue: https://github.com/daishiman/UBM-Hyogo/issues/247
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: NON_VISUAL
spec_classification: implementation_spec
created_at: 2026-05-26
---

# issue-247 — apps/web OpenNext wrangler 設定回帰テスト追加

## 実装区分

`[実装区分: 実装仕様書]`

理由: `apps/web/__tests__/opennext-config-regression.spec.ts` の **新規 vitest 追加** と `.github/workflows/ci.yml` CI 組み込み差分を伴う。`docs-only` ではない。

workflow_state: `implemented_local_evidence_captured`

## 概要

UT-06-FU-A で確立した OpenNext on Workers 構成の構造的不変条件（`pages_build_output_dir` 不在 / env-scoped `[assets]` / `deploy` script 不在 / `.assetsignore` 必須行）を、vitest による単一 spec で機械的に検証し、CI で PR ブロッカーとして組み込む。

## 現状確認（2026-05-26）

| 項目 | 現状 | AC 想定 |
|------|------|---------|
| `apps/web/wrangler.toml` トップレベル `pages_build_output_dir` | 不在 | 不在を assert |
| `apps/web/wrangler.toml` `[env.staging.assets]` / `[env.production.assets]` | 存在 (`directory = ".open-next/assets"`) | 存在 & directory 値検証 |
| `apps/web/package.json` `scripts.deploy` | 不在 | 不在を assert |
| `apps/web/.assetsignore` | `node_modules` / `.DS_Store` / `.git` / `*.map` / `*.test.*` / `*.spec.*` / `__tests__` 全行存在 | 必須行存在を assert |
| 自動 regression test | `apps/web/__tests__/opennext-config-regression.spec.ts` 配置済み | 本 workflow で追加 |

つまり: 現コードは AC 期待状態であり、drift 検出の自動 gate も本 workflow で追加済み。

## 仕様書ファイル一覧

| Phase | ファイル |
|-------|---------|
| 1 | `phase-1-requirements.md` |
| 2 | `phase-2-design.md` |
| 3 | `phase-3-design-review.md` |
| 4 | `phase-4-test-plan.md` |
| 5 | `phase-5-implementation.md` |
| 6 | `phase-6-test-additions.md` |
| 7 | `phase-7-coverage.md` |
| 8 | `phase-8-refactor.md` |
| 9 | `phase-9-qa.md` |
| 10 | `phase-10-final-review.md` |
| 11 | `phase-11-manual-test.md` |
| 12 | `phase-12-documentation.md` |
| 13 | `phase-13-pr.md` |

## スコープ

今回サイクルで完了:

- 新規: `apps/web/__tests__/opennext-config-regression.spec.ts`（vitest 単一 spec、5 assertion）
- 変更: `.github/workflows/ci.yml`（web typecheck job 後に regression spec 実行 step を追加）
- 正本同期: `aiworkflow-requirements` quick-reference / resource-map / task-workflow-active / deployment OpenNext spec / artifact inventory / changelog / LOGS / lessons
- evidence: focused Vitest regression guard PASS

先送り: なし。

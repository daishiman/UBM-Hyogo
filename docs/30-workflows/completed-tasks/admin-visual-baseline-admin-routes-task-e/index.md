# admin-visual-baseline-admin-routes-task-e

> Branch: `feat/admin-ui-prototype-alignment`  
> 実装区分: **実装仕様書**  
> 状態: `implemented_local_runtime_pending`  
> 作成日: 2026-05-27  
> task type: `implementation` / `VISUAL`  
> parent workflow: `docs/30-workflows/admin-ui-prototype-alignment/`

## 背景

親 workflow `admin-ui-prototype-alignment` の Task A-D で admin shell / dashboard / page header / attendance primitive を整備した後、Task E として admin required routes の staging visual baseline を固定する。

この workflow はコード変更を伴う実装仕様であり、`apps/web/playwright/tests/visual/admin-shell/`、`apps/web/playwright.config.ts`、`.github/workflows/playwright-smoke.yml` を実装対象に含む。baseline PNG の実撮影、bot push 後の空 commit、required status check PUT、commit / push / PR は user-gated として分離する。

## Scope

| 区分 | 内容 |
| --- | --- |
| required routes | 10 routes: `/admin`, `/admin/dashboard/attendance`, `/admin/members`, `/admin/tags`, `/admin/meetings`, `/admin/schema`, `/admin/schema/history`, `/admin/requests`, `/admin/identity-conflicts`, `/admin/audit` |
| env-gated routes | 2 routes: `/admin/members/[id]`, `/admin/meetings/[id]` |
| default baseline | required 10 routes x 4 viewport = 40 PNG |
| full baseline | required 10 + env-gated 2 routes x 4 viewport = 48 PNG |
| forbidden baseline | 44 PNG. detail routes are enabled only when both seed IDs are present |

## Phase一覧

| Phase | File | 内容 |
| --- | --- | --- |
| 1 | [phase-1-requirements.md](phase-1-requirements.md) | 要件定義 |
| 2 | [phase-2-design.md](phase-2-design.md) | 設計 |
| 3 | [phase-3-design-review.md](phase-3-design-review.md) | 設計レビュー |
| 4 | [phase-4-test-plan.md](phase-4-test-plan.md) | テスト計画 |
| 5 | [phase-5-implementation.md](phase-5-implementation.md) | 実装 |
| 6 | [phase-6-test-additions.md](phase-6-test-additions.md) | テスト追加 |
| 7 | [phase-7-coverage.md](phase-7-coverage.md) | カバレッジ |
| 8 | [phase-8-refactor.md](phase-8-refactor.md) | リファクタリング |
| 9 | [phase-9-qa.md](phase-9-qa.md) | QA |
| 10 | [phase-10-final-review.md](phase-10-final-review.md) | 最終レビュー |
| 11 | [phase-11-manual-test.md](phase-11-manual-test.md) | 手動テスト / Evidence |
| 12 | [phase-12-documentation.md](phase-12-documentation.md) | ドキュメント |
| 13 | [phase-13-pr.md](phase-13-pr.md) | PR |

## Strict 7

Phase 12 strict 7 はこの workflow root の `outputs/phase-12/` に配置する。親 workflow の strict 7 とは別に、Task E の成果物として root/output `artifacts.json` parity と aiworkflow sync を保持する。

# Unassigned Task Detection — 08b

> 本タスクの scope 外で、本質的に問題が生じる課題のみ列挙する。軽微な改善は含めない。

## U-1. 実 screenshot 撮影 + axe-report 実生成

| 項目 | 内容 |
| --- | --- |
| 課題 | Phase 11 の 44 枚 screenshot と `axe-report.json` の **実取得**は `scaffolding-only` の本タスクでは未実施。`workflow_state: spec_created` 境界 + 上流 wave 6（公開 / login / profile UI）と wave 7（admin / search / density / attendance UI）が完全 green でない限り実走できない |
| 影響 | AC-1〜8 の実 evidence 充足は未達のまま 09a へ送出される |
| 委譲先 | 上流 6/7 wave 全マージ後の **後続実装 task** もしくは **09a-staging-deploy-smoke** |
| 実行条件 | 上流 6 task 完全 green + local 起動 7 step（`outputs/phase-05/runbook.md`）|
| 状態 | formalized: `docs/30-workflows/unassigned-task/task-08b-playwright-e2e-full-execution-001.md` |

## U-2. visual regression baseline 確立（attendance UI 以外）

| 項目 | 内容 |
| --- | --- |
| 課題 | Playwright の `toHaveScreenshot()` による pixel diff baseline を全 44 cell に拡大すると、UI 微変更で false positive が増えるため、scope を限定する判断が必要 |
| 影響 | UI regression が本番に流出し得る |
| 委譲先 | **09a**（staging baseline 確立後にどこまで対象化するか判断） |
| 状態 | unassigned |

## U-3. flaky test 観測 / retry 戦略

| 項目 | 内容 |
| --- | --- |
| 課題 | 70+ test を desktop + mobile で並列実行する際、network / D1 seed 競合に起因する flaky が出現する可能性。`playwright.config.ts` の `retries` / `workers` を実走後にチューニングする必要がある |
| 影響 | CI 偽 fail で merge ブロックが発生 |
| 委譲先 | **09a** または 09b（release runbook 側でチューニング指針を持つ） |
| 状態 | unassigned |

## U-4. firefox / mobile-chromium browser project 追加

| 項目 | 内容 |
| --- | --- |
| 課題 | scaffold config は desktop firefox も含むが、09b の品質基準と無料枠予算が確定するまで PR / push gate にはしない |
| 影響 | 一部ブラウザ固有 bug が拾えない |
| 委譲先 | **09b**（release runbook の品質基準と無料枠予算で判断） |
| 状態 | unassigned |

## U-5. staging URL ベースの Playwright 実走

| 項目 | 内容 |
| --- | --- |
| 課題 | 本タスクは local 完結（`PLAYWRIGHT_BASE_URL=http://localhost:3000`）。staging URL に向けた実走は環境変数差し替えで可能だが、認証 cookie 注入と D1 seed の戦略を再設計する必要 |
| 影響 | staging 環境固有の挙動（CDN cache / Workers runtime 差分）が拾えない |
| 委譲先 | **09a-staging-deploy-smoke** |
| 状態 | unassigned |

## サマリ

| # | 課題 | 委譲先 | 緊急度 |
| --- | --- | --- | --- |
| U-1 | 実 screenshot + axe 実生成 | 後続実装 / 09a | High |
| U-2 | visual regression baseline 拡大 | 09a | Medium |
| U-3 | flaky 観測 / retry チューニング | 09a / 09b | Medium |
| U-4 | firefox / mobile-chromium 追加 | 09b | Low |
| U-5 | staging URL Playwright | 09a | High |

→ 5 件記載（完了条件「5 件以上」を満たす）。

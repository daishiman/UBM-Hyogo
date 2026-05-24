---
workflow_id: ut-25-deriv-02-sa-key-expiry-monitoring
title: UT-25-DERIV-02 SA key 失効監視ワークフロー
status: draft
created: 2026-05-22
owner: daishiman
github_issue: 243
---

# UT-25-DERIV-02: SA key 失効監視 ワークフロー index

[実装区分: 実装仕様書]

## 概要

UT-25 で本番配置済みの `GOOGLE_SERVICE_ACCOUNT_JSON` シークレットが Google 側で失効・無効化された場合に、本番運用中の `apps/api` Workers が沈黙故障することを防ぐための検出・通知経路を構築する。Sheets API の 401（key 無効）/ 403（権限剥奪）を区別して構造化ログ化し、Cloudflare Workers free plan の cron 3 本上限（`"0 18 * * *"`, `"*/15 * * * *"`, `"*/5 * * * *"`）を増やさずに既存 `*/15 * * * *` cron に health check を相乗りさせる。

## Phase 一覧

| Phase | ファイル | 目的 |
| --- | --- | --- |
| 1 | [phase-01-requirements.md](./phase-01-requirements.md) | 機能 / 非機能要件、不変条件 |
| 2 | [phase-02-architecture.md](./phase-02-architecture.md) | アーキテクチャ図、依存関係 |
| 3 | [phase-03-task-breakdown.md](./phase-03-task-breakdown.md) | SRP に基づく step 分解 |
| 4 | [phase-04-contracts.md](./phase-04-contracts.md) | TypeScript 型契約、event schema |
| 5 | [phase-05-implementation-guide.md](./phase-05-implementation-guide.md) | ファイル / 関数 / diff サンプル |
| 6 | [phase-06-test-strategy.md](./phase-06-test-strategy.md) | unit / contract / smoke 戦略 |
| 7 | [phase-07-quality-gates.md](./phase-07-quality-gates.md) | CI gate と通過条件 |
| 8 | [phase-08-dod.md](./phase-08-dod.md) | 完了条件チェックリスト |
| 9 | [phase-09-risks.md](./phase-09-risks.md) | リスクと緩和策 |
| 10 | [phase-10-local-verification.md](./phase-10-local-verification.md) | ローカル検証コマンド列 |
| 11 | [phase-11-evidence-inventory.md](./phase-11-evidence-inventory.md) | evidence 表 |
| 12 | [phase-12-compliance-check.md](./phase-12-compliance-check.md) | canonical 9 headings 自己点検 |
| 13 | [phase-13-commit-pr-draft.md](./phase-13-commit-pr-draft.md) | commit / PR 草案 |

## 補助

- [SCOPE.md](./SCOPE.md): 含む / 含まない / 不変条件 / 正本順位
- [artifacts.json](./artifacts.json): gates / phases metadata

## 関連 issue

- 元仕様: `docs/30-workflows/unassigned-task/UT-25-DERIV-02-sa-key-expiry-monitoring.md`
- 逆参照先: `docs/30-workflows/completed-tasks/ut-25-cloudflare-secrets-production-deploy/outputs/phase-13/rollback-runbook.md`
- 下流連携: UT-25-DERIV-01（rotation SOP）
- 配線フォローアップ: `docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/`（API_INTERNAL_BASE_URL vars 配線 / issue #857）

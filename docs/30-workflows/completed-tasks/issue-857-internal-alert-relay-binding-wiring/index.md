---
workflow_id: issue-857-internal-alert-relay-binding-wiring
title: issue #857 sheets-auth healthcheck internal alert relay binding 配線
status: implemented_local_evidence_captured
created: 2026-05-24
owner: daishiman
github_issue: 857
github_issue_state: closed
---

# issue #857: sheets-auth healthcheck internal alert relay binding 配線 — ワークフロー index

[実装区分: 実装仕様書]

## 概要

`apps/api/src/scheduled/sheets-auth-healthcheck.ts` は SA key 失効（Sheets API 401/403）を検出すると `${env.API_INTERNAL_BASE_URL}/internal/alert-relay` へ POST して Slack / mail へ通知する設計だったが、作成時 baseline では `apps/api/wrangler.toml` の `[env.staging.vars]` / `[env.production.vars]` に `API_INTERNAL_BASE_URL` が未登録で、deploy 後も `postAlertRelay()` が `reason: "missing API_INTERNAL_BASE_URL or token"` で no-op に落ちる状態だった。本ワークフローでは `API_INTERNAL_BASE_URL` を 2 環境 vars へ配線し、SA key 失効時に alert が実際に発火できる local implementation 状態を確立した。

## 現コード最適化判定（issue 原文との差分）

issue #857 / 元 unassigned-task spec の「`INTERNAL_ALERT_TOKEN` を新規 Cloudflare Secret として投入する」スコープは、**現在のコードでは有害**である。受信側 `apps/api/src/middleware/verify-cf-webhook-auth.ts` は `cf-webhook-auth` header を **`CF_WEBHOOK_AUTH_SECRET` のみ**と照合する。一方 healthcheck 送信側は `env.INTERNAL_ALERT_TOKEN ?? env.CF_WEBHOOK_AUTH_SECRET` を送る。`INTERNAL_ALERT_TOKEN` を `CF_WEBHOOK_AUTH_SECRET` と異なる値で投入すると relay が 401 を返し alert が黙って drop される。

→ 本ワークフローは現コードに最適化し、**新規 `INTERNAL_ALERT_TOKEN` Secret を投入せず**、既存 `CF_WEBHOOK_AUTH_SECRET` fallback 経路を正本とする。根本要件は「`API_INTERNAL_BASE_URL` の vars 配線」と「`CF_WEBHOOK_AUTH_SECRET` Secret の name presence 確認」の 2 点に収束する。

## issue 状態

issue #857 は **CLOSED**（2026-05-24 01:32:40Z）。ユーザー指示によりクローズドのまま扱い、re-open はしない。本サイクルでは `Refs #857` の実装として `API_INTERNAL_BASE_URL` 配線、fallback 回帰テスト、Phase 11/12 証跡、aiworkflow 正本同期まで完了した。Cloudflare secret list / staging deploy / Workers tail / commit / push / PR は user-gated。

## Phase 一覧

| Phase | ファイル | 目的 |
| --- | --- | --- |
| 1 | [phase-01-requirements.md](./phase-01-requirements.md) | 機能 / 非機能要件、不変条件、現コード命名規則 |
| 2 | [phase-02-architecture.md](./phase-02-architecture.md) | 送受信 binding トポロジ、token 検証経路 |
| 3 | [phase-03-task-breakdown.md](./phase-03-task-breakdown.md) | SRP に基づく step 分解 |
| 4 | [phase-04-contracts.md](./phase-04-contracts.md) | wrangler.toml var 契約、env.ts 型、token 解決契約 |
| 5 | [phase-05-implementation-guide.md](./phase-05-implementation-guide.md) | 変更ファイル / diff サンプル / 実装順序 |
| 6 | [phase-06-test-strategy.md](./phase-06-test-strategy.md) | config 回帰 guard / contract spec 戦略 |
| 7 | [phase-07-quality-gates.md](./phase-07-quality-gates.md) | CI gate と通過条件 |
| 8 | [phase-08-dod.md](./phase-08-dod.md) | 完了条件チェックリスト |
| 9 | [phase-09-risks.md](./phase-09-risks.md) | リスクと緩和策 |
| 10 | [phase-10-local-verification.md](./phase-10-local-verification.md) | ローカル検証コマンド列 |
| 11 | [phase-11-evidence-inventory.md](./phase-11-evidence-inventory.md) | evidence 表（NON_VISUAL） |
| 12 | [phase-12-compliance-check.md](./phase-12-compliance-check.md) | canonical 9 headings 自己点検 |
| 13 | [phase-13-commit-pr-draft.md](./phase-13-commit-pr-draft.md) | commit / PR 草案 |

## 実装サマリ（2026-05-24）

| 項目 | 結果 |
| --- | --- |
| workflow_state | `implemented_local_evidence_captured` |
| 実装 | `apps/api/wrangler.toml` の production/staging vars に `API_INTERNAL_BASE_URL` 追加 |
| 回帰テスト | `sheets-auth-healthcheck.binding.spec.ts` 新設、`sheets-auth-healthcheck.contract.spec.ts` に `CF_WEBHOOK_AUTH_SECRET` fallback ケース追加 |
| 正本同期 | aiworkflow quick-reference / resource-map / task-workflow-active / artifact inventory / changelog に同期 |
| user-gated | Secret name presence、staging deploy/tail、SA key invalidation dry-run、commit、push、PR |

## 補助

- [SCOPE.md](./SCOPE.md): 含む / 含まない / 不変条件 / 正本順位
- [artifacts.json](./artifacts.json): gates / phases metadata

## 関連 issue / ファイル

- 元 issue: [#857](https://github.com/daishiman/UBM-Hyogo/issues/857)（CLOSED）
- 元 unassigned-task spec: `docs/30-workflows/completed-tasks/UT-25-DERIV-02-FU-01-internal-alert-binding-wiring.md`
- 親ワークフロー: `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/`
- 送信側: `apps/api/src/scheduled/sheets-auth-healthcheck.ts`（`postAlertRelay` L83-119）
- 受信側: `apps/api/src/routes/internal/alert-relay.ts` / `apps/api/src/middleware/verify-cf-webhook-auth.ts`
- 配線対象: `apps/api/wrangler.toml`（`[env.production.vars]` / `[env.staging.vars]`）
- 型宣言: `apps/api/src/env.ts:109-112`

---
phase: 9
title: Risks
workflow_id: issue-857-internal-alert-relay-binding-wiring
status: completed
---

# Phase 9: Risks — internal alert relay binding 配線

[実装区分: 実装仕様書]

## 1. リスクと緩和策

| # | リスク | 影響 | 緩和策 |
| --- | --- | --- | --- |
| R-1 | 片環境のみ vars 追加（parity 崩れ） | sibling 環境が静かに no-op | config guard test（TC-01/02）で両環境を CI assert |
| R-2 | `INTERNAL_ALERT_TOKEN` を別値で投入 | relay 401 で alert drop（issue 原文の罠） | 本タスクでは投入しない方針を SCOPE / Phase 1 不変条件に明記。TC-04 で fallback 経路を固定 |
| R-3 | `CF_WEBHOOK_AUTH_SECRET` が staging/prod 未投入 | relay 500（middleware）or 送信側 skip | Phase 10 で name presence 確認手順を runbook 化 |
| R-4 | `ALERT_DEDUP_KV` 未 binding | dedup 無効（alert 重複の可能性） | 非ブロッカー（route が try/catch で degrade forward）。Phase 12 未タスク候補に「KV 有効化」を記録 |
| R-5 | base URL 末尾スラッシュ混入 | `//internal/alert-relay` で 404 | TC-03 で末尾スラッシュなしを assert |
| R-6 | self-subrequest が free plan subrequest 上限を侵食 | cron 失敗 | 失効時のみ POST・10 分窓 dedup 前提。NFR-5 で許容 |
| R-7 | 受信側 Slack/mail 送信先未設定 | POST は届くが通知が出ない | UT-17/UT-08 スコープ。本タスクは relay 到達までを保証 |

## 2. ロールバック

vars 追加は config のみのため、`API_INTERNAL_BASE_URL` 行を削除して再 deploy すれば即座に従来の no-op 状態へ戻る（破壊的変更なし）。guard test も同 PR で revert。

## 3. 未タスク候補（Phase 12 で formalize）

- **[候補-1]** `verify-cf-webhook-auth.ts` の multi-token 対応（`INTERNAL_ALERT_TOKEN` を `CF_WEBHOOK_AUTH_SECRET` と分離して鍵ローテーション影響範囲を絞る）。現状は MVP として fallback 共有で良い。
- **[候補-2]** `ALERT_DEDUP_KV` namespace の staging/production 有効化（user-gated）。

> いずれも今回サイクルでの完了は不要（外部 user-gate / 運用フェーズ判断）。CONST_007 の例外条件（合意未済 / user-gate）に該当するため分離可。

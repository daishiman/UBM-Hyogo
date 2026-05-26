---
phase: 2
title: Architecture
workflow_id: issue-857-internal-alert-relay-binding-wiring
status: completed
---

# Phase 2: Architecture — internal alert relay binding 配線

[実装区分: 実装仕様書]

## 1. 送受信トポロジ（現コード）

```
[*/15 cron] ─ ctx.waitUntil ─▶ runSheetsAuthHealthcheck(env, event)
                                   │ Sheets API 最小 read (A1:A1)
                                   ▼
                        401/403 → cls.isAuthFailure = true
                                   │
                                   ▼  postAlertRelay(env, cls, fetch)
        base  = env.API_INTERNAL_BASE_URL          ← ★未配線（本タスクで追加）
        token = env.INTERNAL_ALERT_TOKEN
                 ?? env.CF_WEBHOOK_AUTH_SECRET       ← fallback（正本経路）
                                   │ POST ${base}/internal/alert-relay
                                   │ header: cf-webhook-auth: <token>
                                   ▼
                    [同一 Worker] /internal/alert-relay route
                                   │ verifyCfWebhookAuth middleware
                                   │   expected = env.CF_WEBHOOK_AUTH_SECRET
                                   │   header === expected ? next() : 401
                                   ▼
                    handleSheetsAuthAlert → ALERT_DEDUP_KV(任意) → Slack/mail
```

## 2. 本タスクの介入点

| 介入点 | 種別 | 内容 |
| --- | --- | --- |
| `wrangler.toml [env.production.vars]` | 編集 | `API_INTERNAL_BASE_URL` 追加 |
| `wrangler.toml [env.staging.vars]` | 編集 | `API_INTERNAL_BASE_URL` 追加 |
| `env.ts:109-112` | 編集 | コメントを deploy-required + token 整合に更新 |
| `sheets-auth-healthcheck.binding.spec.ts` | 新規 | config guard（2 環境 vars presence） |
| `sheets-auth-healthcheck.contract.spec.ts` | 編集 | `CF_WEBHOOK_AUTH_SECRET` fallback ケース追加 |
| Cloudflare Secrets | runtime（user-gated） | `CF_WEBHOOK_AUTH_SECRET` name presence 確認 |

> **コード surface は新規追加しない**。送受信のロジック・型は不変。vars（config）と test のみを変更する。

## 3. token 整合の設計判断（最重要）

受信 middleware は `CF_WEBHOOK_AUTH_SECRET` 単一照合のため、送信 token は必ず `CF_WEBHOOK_AUTH_SECRET` と一致する必要がある。送信側 `INTERNAL_ALERT_TOKEN ?? CF_WEBHOOK_AUTH_SECRET` の解決を以下 3 ケースで整理する。

| ケース | `INTERNAL_ALERT_TOKEN` | 送信 token | relay 結果 | 採否 |
| --- | --- | --- | --- | --- |
| A（採用） | 未設定 | `CF_WEBHOOK_AUTH_SECRET` | 200 | ✅ 本タスクの正本 |
| B | `CF_WEBHOOK_AUTH_SECRET` と同値 | 一致 | 200 | △ 冗長（投入不要） |
| C | 別値 | 不一致 | **401（drop）** | ❌ 禁止（issue 原文の罠） |

→ ケース A を採用。`INTERNAL_ALERT_TOKEN` Secret は投入しない。将来 token を分離する場合は `verify-cf-webhook-auth.ts` を multi-token 対応に拡張する別タスクが前提（本スコープ外・Phase 9 / 12 未タスク候補に記録）。

## 4. base URL 値の設計判断

healthcheck は同一 Worker の `/internal/alert-relay` を public URL 経由で叩く self-subrequest。よって `API_INTERNAL_BASE_URL` は各環境の自 Worker public URL = 既存 `AUTH_URL` と同値にする。

| env | `API_INTERNAL_BASE_URL` 値 | 根拠 |
| --- | --- | --- |
| production | `https://api.ubm-hyogo.workers.dev` | `[env.production.vars].AUTH_URL` と同値 |
| staging | `https://api-staging.ubm-hyogo.workers.dev` | `[env.staging.vars].AUTH_URL` と同値 |

## 5. 依存関係

| 種別 | 対象 | 状態 |
| --- | --- | --- |
| 上流 | UT-25-DERIV-02 healthcheck 実装（#860） | 完了（merged） |
| 上流 | `CF_WEBHOOK_AUTH_SECRET` Secret 投入（UT-17） | 既存 alert-relay route が使用中・name presence 確認のみ |
| 並走 | `ALERT_DEDUP_KV` namespace 有効化 | user-gated（未有効化でも forward は degrade 継続・本タスク非ブロッカー） |
| 下流 | UT-25-DERIV-02 Phase 11 staging dry-run | 本タスク完了で alert 発火確認が可能になる |

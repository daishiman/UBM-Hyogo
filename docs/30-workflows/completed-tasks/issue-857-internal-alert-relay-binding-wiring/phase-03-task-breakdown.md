---
phase: 3
title: Task Breakdown
workflow_id: issue-857-internal-alert-relay-binding-wiring
status: completed
---

# Phase 3: Task Breakdown — internal alert relay binding 配線

[実装区分: 実装仕様書]

## 1. SRP step 分解

| step | 責務（単一） | 対象ファイル | 種別 | 依存 |
| --- | --- | --- | --- | --- |
| step-01 | production vars に `API_INTERNAL_BASE_URL` 追加 | `apps/api/wrangler.toml` | 編集 | なし |
| step-02 | staging vars に `API_INTERNAL_BASE_URL` 追加 | `apps/api/wrangler.toml` | 編集 | なし |
| step-03 | env.ts コメントを deploy-required + token 整合に更新 | `apps/api/src/env.ts` | 編集 | なし |
| step-04 | config guard test 新設（2 環境 vars presence） | `apps/api/src/scheduled/sheets-auth-healthcheck.binding.spec.ts` | 新規 | step-01,02 |
| step-05 | contract spec に `CF_WEBHOOK_AUTH_SECRET` fallback ケース追加 | `apps/api/src/scheduled/sheets-auth-healthcheck.contract.spec.ts` | 編集 | なし |
| step-06 | 親ワークフロー index へ逆参照追記 | `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/index.md` | 編集 | なし |
| step-07 | `CF_WEBHOOK_AUTH_SECRET` name presence 確認（runbook 手順） | Cloudflare Secrets（runtime） | 検証 | step-01,02 deploy 後 |

## 2. 実行順序

```
step-01 ─┐
step-02 ─┼─▶ step-04 (guard test) ─▶ vitest
step-03 ─┘
step-05 ──────────────────────────▶ vitest
step-06 (独立)
step-07 (deploy 後・user-gated)
```

step-01〜03 は並列編集可（同一ファイル wrangler.toml の step-01/02 は連続編集）。step-04 は step-01/02 の追加結果に依存。step-05 は独立。step-06 は独立。step-07 は deploy 後の runtime 検証。

## 3. 単一責務の境界

- **config 配線**（step-01/02）と **型ドキュメント**（step-03）と **回帰 guard**（step-04/05）を混在させない。
- guard test（step-04）は config presence の静的 assert のみ。fallback の動的検証（step-05）は contract spec 側に閉じる。
- runtime 検証（step-07）はコード変更を伴わない user-gated op として分離する。

## 4. 想定変更ファイル俯瞰

| パス | 変更種別 | LOC 目安 |
| --- | --- | --- |
| `apps/api/wrangler.toml` | 編集 | +2（2 行追加） |
| `apps/api/src/env.ts` | 編集 | コメント数行更新 |
| `apps/api/src/scheduled/sheets-auth-healthcheck.binding.spec.ts` | 新規 | ~40 |
| `apps/api/src/scheduled/sheets-auth-healthcheck.contract.spec.ts` | 編集 | +~25（1 ケース追加） |
| `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/index.md` | 編集 | +1 行 |

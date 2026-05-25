---
phase: 7
title: Quality Gates
workflow_id: issue-857-internal-alert-relay-binding-wiring
status: completed
---

# Phase 7: Quality Gates — internal alert relay binding 配線

[実装区分: 実装仕様書]

## 1. CI gate と通過条件

| gate | コマンド | 通過条件 |
| --- | --- | --- |
| typecheck | `mise exec -- pnpm typecheck` | env.ts コメント更新後も型エラー 0 |
| lint | `mise exec -- pnpm lint` | 0 violations（新規 spec 含む） |
| vitest (api unit) | `mise exec -- pnpm --filter @ubm-hyogo/api test sheets-auth-healthcheck` | TC-01〜05 全 green |
| verify-phase12-compliance | CI（`.github/workflows`） | canonical 9 headings / Phase 11 evidence parity |
| gate-metadata:validate | CI | `artifacts.json` zod schema 通過 |

## 2. coverage 対象範囲

本タスクは config 配線中心で新規ロジック実装はない。coverage 対象は:

- `sheets-auth-healthcheck.binding.spec.ts`: wrangler.toml の section 切り出し helper（このファイル内 100%）
- `sheets-auth-healthcheck.ts` の `postAlertRelay` token fallback 分岐（既存・TC-04 で line/branch カバー）

変更していない既存ファイル（`verify-cf-webhook-auth.ts` / `alert-relay.ts`）は対象外。広域 coverage 閾値は既存 api lane の設定を流用する。

## 3. wrangler 構文 gate

vars 追加後、TOML 構文崩れがないことを確認（deploy 前提条件）:

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run
```

> 実 deploy は Phase 10 / 13 で user 承認後。dry-run は config parse 確認用。

## 4. gate 失敗時の方針

- typecheck fail → コメント更新で型行を誤編集していないか確認（型は不変）。
- vitest TC-01/02 fail → vars が両環境に入っているか再確認。
- TC-04 fail → token 解決順序（`INTERNAL_ALERT_TOKEN ?? CF_WEBHOOK_AUTH_SECRET`）と header キー名（`cf-webhook-auth`）を実コードと突合。

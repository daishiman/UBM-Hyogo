# Implementation Guide

## Part 1: 初学者向け

学校の放送係が「職員室に知らせに行く」と決まっていても、職員室の場所を書いた紙が配られていなければ、放送係は動けません。今回の問題はそれと同じです。監視の仕組みは異常に気づけますが、知らせを届ける先の住所が本番用と試し打ち用の両方に書かれていませんでした。

今回やったことは、2つの場所に同じ種類の住所を書くことです。さらに、合い言葉は新しく増やさず、すでに入口で使っている合い言葉を使うと決めました。別の合い言葉を勝手に置くと、入口で止められてしまうからです。

| 用語 | 言い換え |
| --- | --- |
| Worker | インターネット上で動く小さな係 |
| vars | 公開してよい設定メモ |
| Secret | 隠しておく合い言葉 |
| alert relay | 異常のお知らせを運ぶ係 |
| staging | 本番前の試し打ち場所 |

## Part 2: 技術者向け

### Changed Runtime Contract

`apps/api/src/scheduled/sheets-auth-healthcheck.ts` already resolves alert relay transport as:

```ts
const base = env.API_INTERNAL_BASE_URL;
const token = env.INTERNAL_ALERT_TOKEN ?? env.CF_WEBHOOK_AUTH_SECRET;
```

`apps/api/src/middleware/verify-cf-webhook-auth.ts` accepts only `CF_WEBHOOK_AUTH_SECRET`. Therefore issue #857's original `INTERNAL_ALERT_TOKEN` provisioning premise is stale unless the value exactly equals `CF_WEBHOOK_AUTH_SECRET`. The elegant implementation keeps one receiving secret and wires only the missing non-secret base URL.

### Files Changed

| Path | Change |
| --- | --- |
| `apps/api/wrangler.toml` | Add `API_INTERNAL_BASE_URL` to `[env.production.vars]` and `[env.staging.vars]`, mirroring `AUTH_URL`. |
| `apps/api/src/env.ts` | Clarify deploy-required base URL and no-new-token contract. |
| `apps/api/src/scheduled/sheets-auth-healthcheck.binding.spec.ts` | Guard both env vars and `AUTH_URL` parity. |
| `apps/api/src/scheduled/sheets-auth-healthcheck.contract.spec.ts` | Prove `CF_WEBHOOK_AUTH_SECRET` fallback POST header. |

### Runtime Path x Evidence

| Runtime path | Evidence | Status |
| --- | --- | --- |
| production Worker self-subrequest | `API_INTERNAL_BASE_URL = https://api.ubm-hyogo.workers.dev` | local config present |
| staging Worker self-subrequest | `API_INTERNAL_BASE_URL = https://api-staging.ubm-hyogo.workers.dev` | local config present |
| fallback auth token | focused Vitest asserts `cf-webhook-auth: cf-secret` | local test PASS |
| actual alert receipt | Workers tail after deploy and controlled SA key invalidation | pending_user_approval |


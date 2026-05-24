---
phase: 4
title: Contracts
workflow_id: issue-857-internal-alert-relay-binding-wiring
status: completed
---

# Phase 4: Contracts — internal alert relay binding 配線

[実装区分: 実装仕様書]

## 1. wrangler.toml var 契約

各 named environment の `[vars]` テーブルに以下を追加する（TOML 文字列値）。

```toml
# [env.production.vars] 内（AUTH_URL の直後に配置）
API_INTERNAL_BASE_URL = "https://api.ubm-hyogo.workers.dev"

# [env.staging.vars] 内（AUTH_URL の直後に配置）
API_INTERNAL_BASE_URL = "https://api-staging.ubm-hyogo.workers.dev"
```

契約:
- 非機密 URL のため vars に平文で書いてよい。
- 末尾スラッシュを付けない（コード側が `${base}/internal/alert-relay` を連結するため）。
- 値は各環境の `AUTH_URL` と同値（自 Worker public URL）。

## 2. env.ts 型契約（不変・コメントのみ更新）

```ts
// apps/api/src/env.ts:109-112（型は不変、コメントを更新）
// UT-25-DERIV-02 / issue-857: SA key 失効監視 health check → alert-relay 内部 POST 用。
// API_INTERNAL_BASE_URL は wrangler.toml [env.{staging,production}.vars] に deploy-required で配線する。
// 未設定時は postAlertRelay が no-op（alert が飛ばない）。
// token は INTERNAL_ALERT_TOKEN ?? CF_WEBHOOK_AUTH_SECRET。受信 middleware は
// CF_WEBHOOK_AUTH_SECRET のみ照合するため、INTERNAL_ALERT_TOKEN を別値で設定すると relay 401。
// → 現運用では INTERNAL_ALERT_TOKEN を投入せず CF_WEBHOOK_AUTH_SECRET fallback を正本とする。
readonly API_INTERNAL_BASE_URL?: string;
readonly INTERNAL_ALERT_TOKEN?: string;
```

型シグネチャ（`?: string`）は変更しない。optional 維持の理由: unit / local では未設定で skip させ、deploy 時のみ required（runtime 配線で担保）。

## 3. token 解決契約（現コード・不変）

```ts
// apps/api/src/scheduled/sheets-auth-healthcheck.ts:90-91
const base = env.API_INTERNAL_BASE_URL;
const token = env.INTERNAL_ALERT_TOKEN ?? env.CF_WEBHOOK_AUTH_SECRET;
if (!base || !token) { /* skip with reason: "missing API_INTERNAL_BASE_URL or token" */ }
```

受信契約（`verify-cf-webhook-auth.ts`・不変）:

```ts
const expected = c.env.CF_WEBHOOK_AUTH_SECRET ?? null;
// header === expected → next() / mismatch → 401 / expected === null → 500
```

整合契約: `送信 token === CF_WEBHOOK_AUTH_SECRET` を満たすこと。ケース A（`INTERNAL_ALERT_TOKEN` 未設定）で自動成立する。

## 4. config guard test 契約（新規）

```ts
// apps/api/src/scheduled/sheets-auth-healthcheck.binding.spec.ts
// wrangler.toml を read して 2 環境 vars に API_INTERNAL_BASE_URL があることを assert。
// ネットワーク非依存・決定論的。
describe("wrangler.toml internal alert binding", () => {
  it("production.vars に API_INTERNAL_BASE_URL がある", () => { /* assert */ });
  it("staging.vars に API_INTERNAL_BASE_URL がある", () => { /* assert */ });
  it("両環境とも https URL で末尾スラッシュなし", () => { /* assert */ });
});
```

期待値: 3 ケース green。失敗時は「vars 配線が drift した」ことを即座に示す。

## 5. contract fallback test 契約（既存 spec へ追加）

```ts
// sheets-auth-healthcheck.contract.spec.ts へ 1 ケース追加
it("INTERNAL_ALERT_TOKEN 未設定でも CF_WEBHOOK_AUTH_SECRET で alert-relay POST する", async () => {
  const env = {
    GOOGLE_SERVICE_ACCOUNT_JSON: "dummy",
    SHEETS_SPREADSHEET_ID: "sheet-id",
    API_INTERNAL_BASE_URL: "https://api.example.com",
    CF_WEBHOOK_AUTH_SECRET: "cf-secret", // INTERNAL_ALERT_TOKEN は未設定
  } as unknown as Env;
  // 401 を発生させ、fetchSpy の header["cf-webhook-auth"] === "cf-secret" を assert
});
```

期待値: POST 1 回・URL `https://api.example.com/internal/alert-relay`・header `cf-webhook-auth: "cf-secret"`。

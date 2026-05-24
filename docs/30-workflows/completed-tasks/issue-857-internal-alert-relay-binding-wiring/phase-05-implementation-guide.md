---
phase: 5
title: Implementation Guide
workflow_id: issue-857-internal-alert-relay-binding-wiring
status: completed
---

# Phase 5: Implementation Guide — internal alert relay binding 配線

[実装区分: 実装仕様書]

## 0. 変更ファイル一覧（見落とし防止）

| パス | 種別 |
| --- | --- |
| `apps/api/wrangler.toml` | 編集（2 行追加） |
| `apps/api/src/env.ts` | 編集（コメント更新） |
| `apps/api/src/scheduled/sheets-auth-healthcheck.binding.spec.ts` | 新規 |
| `apps/api/src/scheduled/sheets-auth-healthcheck.contract.spec.ts` | 編集（1 ケース追加） |
| `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/index.md` | 編集（逆参照 1 行） |

## 1. step-01 / step-02: wrangler.toml vars 配線

### 1.1 production（`[env.production.vars]` 内、`AUTH_URL = "https://api.ubm-hyogo.workers.dev"` の直後）

```diff
 AUTH_URL = "https://api.ubm-hyogo.workers.dev"
+# issue-857: SA key 失効 healthcheck → /internal/alert-relay 内部 POST の base URL（自 Worker public URL）
+API_INTERNAL_BASE_URL = "https://api.ubm-hyogo.workers.dev"
 SHEET_ID = "10XQqUko2A5jFXT-J0ibvPt3KUX56divqEk6kDccH5vw"
```

### 1.2 staging（`[env.staging.vars]` 内、`AUTH_URL = "https://api-staging.ubm-hyogo.workers.dev"` の直後）

```diff
 AUTH_URL = "https://api-staging.ubm-hyogo.workers.dev"
+# issue-857: SA key 失効 healthcheck → /internal/alert-relay 内部 POST の base URL（自 Worker public URL）
+API_INTERNAL_BASE_URL = "https://api-staging.ubm-hyogo.workers.dev"
 SHEET_ID = "10XQqUko2A5jFXT-J0ibvPt3KUX56divqEk6kDccH5vw"
```

> top-level `[vars]` は named env へ継承されないため、両ブロックに必ず書く。

## 2. step-03: env.ts コメント更新

`apps/api/src/env.ts:109-112` の既存コメントブロックを Phase 4 §2 のコメント文へ置換する。型行（`readonly API_INTERNAL_BASE_URL?: string;` / `readonly INTERNAL_ALERT_TOKEN?: string;`）は変更しない。

## 3. step-04: config guard test 新設

`apps/api/src/scheduled/sheets-auth-healthcheck.binding.spec.ts`（新規）:

```ts
// issue-857: wrangler.toml の 2 環境 vars に API_INTERNAL_BASE_URL が配線されていることを
// 静的に検証する回帰 guard。再 drift（片環境欠落）を CI で即検出する。
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const wranglerPath = resolve(here, "../../wrangler.toml");
const toml = readFileSync(wranglerPath, "utf8");

// 指定 env ブロックを次の [ 見出しまで切り出す簡易パーサ（外部依存なし）。
function section(name: string): string {
  const start = toml.indexOf(`[${name}]`);
  if (start === -1) return "";
  const rest = toml.slice(start + `[${name}]`.length);
  const next = rest.search(/\n\[/);
  return next === -1 ? rest : rest.slice(0, next);
}

describe("wrangler.toml internal alert binding (issue-857)", () => {
  it("production.vars に API_INTERNAL_BASE_URL がある", () => {
    expect(section("env.production.vars")).toMatch(
      /API_INTERNAL_BASE_URL\s*=\s*"https:\/\/[^"]+"/,
    );
  });

  it("staging.vars に API_INTERNAL_BASE_URL がある", () => {
    expect(section("env.staging.vars")).toMatch(
      /API_INTERNAL_BASE_URL\s*=\s*"https:\/\/[^"]+"/,
    );
  });

  it("両環境とも末尾スラッシュなしの https URL", () => {
    for (const env of ["env.production.vars", "env.staging.vars"]) {
      const m = section(env).match(/API_INTERNAL_BASE_URL\s*=\s*"([^"]+)"/);
      expect(m, `${env} に API_INTERNAL_BASE_URL`).not.toBeNull();
      expect(m![1]).toMatch(/^https:\/\//);
      expect(m![1].endsWith("/")).toBe(false);
    }
  });
});
```

> このテストは `apps/api` の unit lane（vitest）で走る。`.contract.spec.ts` ではないため D1 lane 不要。ネットワーク非依存。

## 4. step-05: contract spec に fallback ケース追加

`apps/api/src/scheduled/sheets-auth-healthcheck.contract.spec.ts` の `describe` 末尾に追加:

```ts
it("INTERNAL_ALERT_TOKEN 未設定でも CF_WEBHOOK_AUTH_SECRET で alert-relay POST する", async () => {
  const env = {
    GOOGLE_SERVICE_ACCOUNT_JSON: "dummy",
    SHEETS_SPREADSHEET_ID: "sheet-id",
    API_INTERNAL_BASE_URL: "https://api.example.com",
    CF_WEBHOOK_AUTH_SECRET: "cf-secret",
    // INTERNAL_ALERT_TOKEN は意図的に未設定
  } as unknown as Env;
  const fetcher = makeFetcher(async () => {
    throw new SheetsFetchError("unauthorized", 401);
  });
  const fetchSpy = vi.fn(async () => new Response("{}", { status: 200 }));
  const result = await runSheetsAuthHealthcheck(env, dummyEvent, {
    fetcher,
    fetch: fetchSpy as unknown as typeof fetch,
  });
  expect(result.ok).toBe(false);
  expect(fetchSpy).toHaveBeenCalledTimes(1);
  const calls = fetchSpy.mock.calls as unknown as Array<[unknown, RequestInit]>;
  expect(String(calls[0]![0])).toBe("https://api.example.com/internal/alert-relay");
  const headers = calls[0]![1].headers as Record<string, string>;
  expect(headers["cf-webhook-auth"]).toBe("cf-secret");
});
```

このケースが受信 middleware（`CF_WEBHOOK_AUTH_SECRET` 単一照合）との整合を回帰として固定する。

## 5. step-06: 親ワークフロー逆参照

`docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/index.md` の「関連 issue」セクションに追記:

```md
- 配線フォローアップ: `docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/`（API_INTERNAL_BASE_URL vars 配線 / issue #857）
```

## 6. step-07: CF_WEBHOOK_AUTH_SECRET name presence 確認（deploy 後・user-gated）

詳細コマンドは Phase 10 を参照。`bash scripts/cf.sh secret list --env staging` / `--env production` で `CF_WEBHOOK_AUTH_SECRET` の name が存在することを確認する（値は表示しない）。不在なら `bash scripts/cf.sh secret put --env <env> CF_WEBHOOK_AUTH_SECRET` で投入（user 承認後）。

## 7. 実装順序

step-01 → step-02 → step-03 → step-04 → step-05 → step-06 →（deploy 後）step-07。
step-04 は step-01/02 完了後でないと guard test が即 fail するため順序厳守。

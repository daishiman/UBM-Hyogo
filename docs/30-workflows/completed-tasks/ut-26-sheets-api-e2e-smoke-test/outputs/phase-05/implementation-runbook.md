# UT-26 Phase 5 成果物 — implementation-runbook.md

| 項目 | 値 |
| --- | --- |
| タスク | Sheets API エンドツーエンド疎通確認 (UT-26) |
| Phase | 5 / 13（実装ランブック） |
| 作成日 | 2026-04-29 |
| 状態 | spec_created |
| 前提 | Phase 1〜4 成果物（特に Phase 2 設計、Phase 4 テスト戦略） |

---

## 1. Decision: env 名は既存実装に合わせて `GOOGLE_SHEETS_SA_JSON` を使用する

| 項目 | 決定 | 根拠 |
| --- | --- | --- |
| Service Account JSON env 名 | **`GOOGLE_SHEETS_SA_JSON`** | 既存 `apps/api/src/jobs/sheets-fetcher.ts` (UT-03 / GoogleSheetsFetcher) で使用中。仕様書の `GOOGLE_SHEETS_SA_JSON` 表記は採用しない |
| 認証 client | **`apps/api/src/jobs/sheets-fetcher.ts` 内の `getAccessToken` を再利用** | UT-03 の export 済み実装。`packages/integrations/google/src/forms/auth.ts` の `createTokenSource` (Forms scope) は scope が異なるため reuse しない |
| Spreadsheet ID env 名 | `SHEETS_SPREADSHEET_ID` | 仕様書 / 既存実装で一致 |
| Smoke admin token env 名 | `SMOKE_ADMIN_TOKEN` | 新規（staging のみ配置、production には配置しない） |
| Range デフォルト | `SHEETS_SMOKE_RANGE`、未設定時 `A1:Z10` | 不変条件 #1（schema 固定回避）に整合 |

---

## 2. 編集 / 新規ファイル一覧

### 2.1 新規作成

| パス | 役割 |
| --- | --- |
| `apps/api/src/routes/admin/smoke-sheets.ts` | `GET /admin/smoke/sheets` Hono handler |
| `apps/api/src/routes/admin/smoke/index.ts` | `/admin/smoke/*` グループルータ集約 export |
| `apps/api/src/middlewares/admin-smoke-auth.ts` | `SMOKE_ADMIN_TOKEN` Bearer 検証 middleware |
| `apps/api/src/lib/smoke/env-guard.ts` | production 環境で 404 を返す |
| `apps/api/src/lib/smoke/sheets-smoke-client.ts` | `values.get` の fetch wrapper（GET 専用） |
| `apps/api/src/lib/smoke/error-mapper.ts` | `classifySheetsError` で `SmokeErrorCode` に正規化 |
| `apps/api/src/lib/smoke/format-result.ts` | レスポンス整形（PII redact / 末尾 4 桁化） |
| `apps/api/test/routes/admin/smoke/sheets.test.ts` | unit + authorization 4 ケース |
| `apps/api/test/lib/smoke/format-result.test.ts` | 純粋関数 unit |
| `apps/api/test/lib/smoke/error-mapper.test.ts` | 純粋関数 unit |
| `apps/api/test/lib/smoke/env-guard.test.ts` | 純粋関数 unit |

### 2.2 修正

| パス | 修正内容 |
| --- | --- |
| `apps/api/src/index.ts` | `if (env.ENVIRONMENT !== "production") app.route("/admin/smoke", smokeRouter)` を追加（既存ルート破壊しない） |
| `apps/api/wrangler.toml` | `[env.dev.vars]` / `[env.staging.vars]` に `SHEETS_SPREADSHEET_ID` / `SHEETS_SMOKE_RANGE` を追加。`[env.production]` には smoke 関連 binding を**追加しない** |
| `apps/api/.dev.vars.example` | `GOOGLE_SHEETS_SA_JSON=op://...` / `SHEETS_SPREADSHEET_ID=op://...` / `SMOKE_ADMIN_TOKEN=op://...` のキー名のみ列挙（実値禁止） |

> 既存 `apps/api/src/jobs/sheets-fetcher.ts` (UT-03) は **modify 禁止**、reuse のみ。

---

## 3. 擬似コード

### 3.1 smoke route entry

```ts
// apps/api/src/routes/admin/smoke-sheets.ts
import { Hono } from "hono";
import { getAccessToken } from "@/jobs/sheets-fetcher"; // UT-03 reuse
import { adminSmokeAuth } from "@/middlewares/admin-smoke-auth";
import { envGuard } from "@/lib/smoke/env-guard";
import { fetchValues } from "@/lib/smoke/sheets-smoke-client";
import { classifySheetsError } from "@/lib/smoke/error-mapper";
import { formatResult } from "@/lib/smoke/format-result";

export const smokeSheets = new Hono<{ Bindings: Env }>();

smokeSheets.use("*", envGuard);          // production 多重防御
smokeSheets.use("*", adminSmokeAuth);    // SMOKE_ADMIN_TOKEN 検証

smokeSheets.get("/sheets", async (c) => {
  const startedAt = Date.now();
  try {
    const { accessToken, cacheHit } = await getAccessToken(c.env);
    const range = c.env.SHEETS_SMOKE_RANGE ?? "A1:Z10";
    const valueRange = await fetchValues({
      accessToken,
      spreadsheetId: c.env.SHEETS_SPREADSHEET_ID,
      range,
    });
    const result = formatResult({
      env: c.env.ENVIRONMENT,
      spreadsheetId: c.env.SHEETS_SPREADSHEET_ID,
      valueRange,
      latencyMs: Date.now() - startedAt,
      tokenFetchesDuringSmoke: cacheHit,
    });
    console.log(JSON.stringify({ event: "sheets_smoke_test", status: "success", ...result }));
    return c.json({ ok: true, ...result });
  } catch (e) {
    const { code, httpStatus, hint, runbookRef, retryAfter } = classifySheetsError(e);
    console.log(JSON.stringify({
      event: "sheets_smoke_test",
      status: "error",
      code,
      runbookRef,
      hint,
      latency_ms: Date.now() - startedAt,
    }));
    if (retryAfter) c.header("Retry-After", String(retryAfter));
    return c.json({ ok: false, code, hint, runbookRef }, httpStatus);
  }
});
```

### 3.2 env-guard

```ts
// apps/api/src/lib/smoke/env-guard.ts
import type { MiddlewareHandler } from "hono";

export const envGuard: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  if (c.env.ENVIRONMENT === "production") return c.notFound();
  await next();
};
```

### 3.3 admin-smoke-auth middleware

```ts
// apps/api/src/middlewares/admin-smoke-auth.ts
import type { MiddlewareHandler } from "hono";

export const adminSmokeAuth: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const expected = c.env.SMOKE_ADMIN_TOKEN;
  const auth = c.req.header("Authorization") ?? "";
  if (!expected || auth !== `Bearer ${expected}`) {
    return c.json({ ok: false, code: "UNAUTHORIZED" }, 401);
  }
  await next();
};
```

### 3.4 sheets-smoke-client

```ts
// apps/api/src/lib/smoke/sheets-smoke-client.ts
export async function fetchValues(args: {
  accessToken: string;
  spreadsheetId: string;
  range: string;
}): Promise<{ range: string; majorDimension: string; values?: string[][] }> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(args.spreadsheetId)}/values/${encodeURIComponent(args.range)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${args.accessToken}` },
  });
  if (!res.ok) {
    throw new SheetsHttpError(res.status, await res.text(), res.headers.get("Retry-After"));
  }
  return res.json();
}
```

### 3.5 index.ts (修正)

```ts
// apps/api/src/index.ts (差分のみ)
import { smokeSheets } from "./routes/admin/smoke";

if ((env as any).ENVIRONMENT !== "production") {
  app.route("/admin/smoke", smokeSheets);
}
```

---

## 4. 実装手順（runbook）

### Step 0: 事前ビルドチェック（Phase 4 引き継ぎ）

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter ./apps/api build  # esbuild darwin mismatch 防止
```

> 進む条件: build が成功し中間生成物が出力されること。

### Step 1: Secret / Variable 確認（UT-25 配置済の確認のみ）

```bash
# staging に配置済であることを確認（値は表示しない）
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging | grep GOOGLE_SHEETS_SA_JSON
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging | grep SMOKE_ADMIN_TOKEN

# production に SMOKE_ADMIN_TOKEN が存在しないことを確認（必須）
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production | grep -v SMOKE_ADMIN_TOKEN
```

> 進む条件: staging 側 3 件存在 / production 側 `SMOKE_ADMIN_TOKEN` 不在。

### Step 2: 実装（TDD Red → Green、Phase 4 targeted run 経路）

1. `apps/api/test/lib/smoke/format-result.test.ts` を Red で書く → `format-result.ts` 実装で Green
2. `apps/api/test/lib/smoke/error-mapper.test.ts` を Red で書く → `error-mapper.ts` 実装で Green
3. `apps/api/test/lib/smoke/env-guard.test.ts` を Red で書く → `env-guard.ts` 実装で Green
4. `apps/api/test/routes/admin/smoke/sheets.test.ts` を Red で書く（authorization 4 ケース + production 拒否）→ `sheets.ts` 実装で Green
5. `apps/api/src/routes/admin/smoke/index.ts` で集約 export
6. `apps/api/src/index.ts` でガード付きルート登録
7. `apps/api/wrangler.toml` の `[env.dev.vars]` / `[env.staging.vars]` を更新

実行コマンド:

```bash
mise exec -- pnpm --filter ./apps/api vitest run \
  apps/api/test/routes/admin/smoke/sheets.test.ts \
  apps/api/test/lib/smoke/format-result.test.ts \
  apps/api/test/lib/smoke/error-mapper.test.ts \
  apps/api/test/lib/smoke/env-guard.test.ts
```

### Step 3: ローカル sanity check（wrangler dev --remote）

```bash
# .dev.vars を op run 経由で揮発的に流し込みつつ wrangler dev を起動（remote 必須、--local 禁止）
bash scripts/cf.sh dev --config apps/api/wrangler.toml --env staging --remote

# 別タブで疎通
curl -sS -H "Authorization: Bearer ${SMOKE_ADMIN_TOKEN}" \
  http://127.0.0.1:8787/admin/smoke/sheets | jq

# 期待: {"ok":true,"env":"staging","spreadsheetId_tail4":"...XXXX","sheetTitle":"...","rowCount":N,"latencyMs":...,"tokenFetchesDuringSmoke":false}
```

> 進む条件: HTTP 200 + `ok:true`。401/403 が返る場合は Phase 6 異常系 + Phase 11 troubleshooting-runbook へ。

### Step 4: token cache 確認

```bash
for i in 1 2; do
  curl -sS -H "Authorization: Bearer ${SMOKE_ADMIN_TOKEN}" \
    http://127.0.0.1:8787/admin/smoke/sheets | jq '.tokenFetchesDuringSmoke'
done
# 期待: 1 回目 false / 2 回目 true
```

### Step 5: staging deploy → 実 API 疎通

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging

# staging エンドポイントへ curl
curl -sS -H "Authorization: Bearer ${SMOKE_ADMIN_TOKEN}" \
  https://<api-staging-host>/admin/smoke/sheets | jq

# Workers ログを観測
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging
# 期待: structured log {"event":"sheets_smoke_test","status":"success","latency_ms":<n>}
```

> 進む条件: staging で HTTP 200 + Workers Logs に success エントリ。Phase 11 manual-smoke-log.md へ転記。
> **絶対禁止**: 本タスクで `--env production` を含む `bash scripts/cf.sh deploy` コマンドを一切使用しない。

---

## 5. wrangler dev / staging deploy / curl 実行コマンド例（まとめ）

```bash
# 1. ローカル開発サーバ起動（remote モード）
bash scripts/cf.sh dev --config apps/api/wrangler.toml --env staging --remote

# 2. ローカル疎通
curl -sS -H "Authorization: Bearer ${SMOKE_ADMIN_TOKEN}" \
  http://127.0.0.1:8787/admin/smoke/sheets | jq

# 3. ローカル token cache 確認（2 回連続）
for i in 1 2; do
  curl -sS -H "Authorization: Bearer ${SMOKE_ADMIN_TOKEN}" \
    http://127.0.0.1:8787/admin/smoke/sheets | jq '.tokenFetchesDuringSmoke, .latencyMs'
done

# 4. staging へ deploy
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging

# 5. staging 疎通
curl -sS -H "Authorization: Bearer ${SMOKE_ADMIN_TOKEN}" \
  https://<api-staging-host>/admin/smoke/sheets | jq

# 6. Workers Logs 観測
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging
```

---

## 6. SA JSON / token redact ルール

以下を**ログ・PR 説明・コミットメッセージ・curl 出力例のいかなる場所にも残さない**。

| 項目 | 表現 |
| --- | --- |
| `GOOGLE_SHEETS_SA_JSON` 全文 | 出力しない |
| `private_key` フィールド | 出力しない |
| `client_email` | 出力しない（必要時 `sa:***@***`） |
| `access_token` | 出力しない |
| `Authorization` ヘッダ | 出力しない |
| `SMOKE_ADMIN_TOKEN` | 出力しない |
| `spreadsheetId` 全文 | 末尾 4 桁のみ（`spreadsheetId_tail4`） |
| `values[][]` 生データ | `sampleRowsRedacted` で行数のみ、または英数字を `*` でマスク |

検証手段:

```bash
# PR 上で以下を実行し 0 件であることを確認
rg -n 'BEGIN PRIVATE KEY|access_token=|client_email|SMOKE_ADMIN_TOKEN' --hidden
```

違反検出時: Phase 10 を NO-GO とし、commit を取り直す（git rewrite history は禁止、redact 修正で新規 commit）。

---

## 7. canUseTool 適用範囲

| 操作 | 取扱い |
| --- | --- |
| 新規ファイル 11 件の Write | Edit / Write 許可 |
| `apps/api/src/index.ts` のルート登録差分 | Edit 許可 |
| `apps/api/wrangler.toml` 編集 | Edit 許可 |
| `bash scripts/cf.sh deploy --env staging` | 人手承認後に手動実行（自動実行不可） |
| `bash scripts/cf.sh secret put` | UT-25 で実施済、本タスクでは実行しない |
| `bash scripts/cf.sh deploy --env production` | **N/A（本タスク全体で禁止）** |

---

## 8. sanity check（local → staging の段階的確認）

| 段階 | コマンド | 期待 | 失敗時 |
| --- | --- | --- | --- |
| 1. unit / authorization | `pnpm --filter ./apps/api vitest run apps/api/test/routes/admin/smoke/sheets.test.ts` | 全 Green | Phase 4 のテスト戦略再確認 |
| 2. wrangler dev success | `curl http://127.0.0.1:8787/admin/smoke/sheets` | 200 / `ok:true` | Phase 6 失敗ケース 6.1 (401) / 6.2 (403) |
| 3. wrangler dev cache | 2 回連続 curl | 2 回目 `tokenFetchesDuringSmoke=true` | Phase 6 6.7（cache 不全） |
| 4. staging deploy | `bash scripts/cf.sh deploy --env staging` | exit 0 | Phase 6 6.6（deploy 失敗） |
| 5. staging success | staging URL へ curl | 200 / `ok:true` | Phase 6 6.1〜6.5 |
| 6. Workers Logs | `bash scripts/cf.sh tail --env staging` | success エントリ | Phase 6 6.7 |

---

## next: Phase 6 へ引き渡す事項

- **擬似コード上の例外パス** (`classifySheetsError` の 7 区分: SHEETS_AUTH_FAILED / FORBIDDEN / NOT_FOUND / RATE_LIMITED / UPSTREAM_ERROR / PARSE_ERROR / NETWORK_ERROR) → Phase 6 failure-cases.md の入力
- **Step 3〜5 のローカル / staging 検証手順** → Phase 11 manual-smoke-log.md / troubleshooting-runbook.md で再利用
- **redact ルール** → Phase 11 / Phase 13 PR 作成での違反検出基準として使用
- **env 名 Decision (`GOOGLE_SHEETS_SA_JSON`)** → Phase 12 implementation-guide / system-spec-update-summary に反映
- **production 露出禁止の三段ガード**（build-time / env-guard / SMOKE_ADMIN_TOKEN） → Phase 9 / 10 で繰り返し検証

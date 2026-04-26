# UT-03: Sheets API 認証方式設定 - 実装ガイド

## Part 1: はじめて読む人向け

### なぜ必要か

Google Sheets は、鍵のかかった共有ノートのようなものです。誰でも中身を読める状態にすると危険ですが、毎回人が鍵を開けに行くのも面倒です。

UT-03 では、Cloudflare Workers が「このアプリは読んでよい相手です」と Google に伝え、一時的な入場券を受け取る仕組みを作りました。入場券はしばらく使えるので、毎回 Google に取りに行かず、短い時間だけ手元に置いて再利用します。

### 何をするか

`packages/integrations/src/sheets-auth.ts` は、次の流れを担当します。

1. サービスアカウントの鍵を安全に読み取る
2. Google に渡す署名付きの証明書を作る
3. Google から Sheets API 用の一時的な入場券を受け取る
4. 入場券がまだ使える間はキャッシュから返す

このタスクは「Sheets を読むための入場券を取るところ」までを担当します。実際に Sheets の行や列を読む処理は UT-09 の責務です。

### 画面証跡について

この変更は API / integration 境界の非画面タスクです。UI/UX 変更はないためスクリーンショットは対象外です。

証跡は `outputs/phase-11/main.md`、`outputs/phase-11/manual-smoke-log.md`、`outputs/phase-11/link-checklist.md` に保存しています。

## Part 2: 開発者向け

### 実装ファイル

| ファイル | 内容 |
| --- | --- |
| `packages/integrations/src/sheets-auth.ts` | JWT 署名・トークン取得・TTL キャッシュ |
| `packages/integrations/src/sheets-auth.test.ts` | AUTH-01 から AUTH-06 の回帰テスト（12 tests） |
| `packages/integrations/src/index.ts` | root export からの再公開 |
| `packages/integrations/package.json` | `./sheets-auth` subpath export |
| `.gitignore` | `.dev.vars` / `**/.dev.vars` の除外 |

### Public API

```typescript
export interface SheetsAuthEnv {
  GOOGLE_SERVICE_ACCOUNT_JSON: string;
  SHEETS_TOKEN_CACHE?: SheetsTokenCache;
}

export interface SheetsTokenCache {
  get<T = unknown>(key: string, type: "json"): Promise<T | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export interface ServiceAccountKey {
  type: "service_account";
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  token_uri: string;
}

export interface AccessTokenResult {
  accessToken: string;
  expiresAt: number;
}

export class SheetsAuthError extends Error {
  constructor(message: string, cause?: unknown);
}

export function importPrivateKey(pemKey: string): Promise<CryptoKey>;
export function createSignedJWT(
  key: CryptoKey,
  payload: Record<string, unknown>,
): Promise<string>;
export function getAccessToken(env: SheetsAuthEnv): Promise<AccessTokenResult>;
```

### Import

```typescript
import { getAccessToken, type SheetsAuthEnv } from "@ubm-hyogo/integrations/sheets-auth";
```

Root export からも取得できます。

```typescript
import { getAccessToken, type SheetsAuthEnv } from "@ubm-hyogo/integrations";
```

### 使用例

```typescript
import { getAccessToken, type SheetsAuthEnv } from "@ubm-hyogo/integrations/sheets-auth";

interface Env extends SheetsAuthEnv {
  SPREADSHEET_ID: string;
}

export default {
  async fetch(_request: Request, env: Env): Promise<Response> {
    const { accessToken } = await getAccessToken(env);

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${env.SPREADSHEET_ID}/values/Sheet1!A1:Z`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!response.ok) {
      return Response.json(
        { error: "Sheets API request failed", status: response.status },
        { status: response.status },
      );
    }

    return Response.json(await response.json());
  },
};
```

### 設定値

| 名前 | 値 | 用途 |
| --- | --- | --- |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Service Account JSON key | ローカルは `.dev.vars`、staging/production は Cloudflare Secrets |
| `SHEETS_TOKEN_CACHE` | Workers KV binding | 任意。アクセストークンの共有キャッシュ |
| `SCOPE` | `https://www.googleapis.com/auth/spreadsheets.readonly` | Sheets 読み取り専用の最小権限 |
| `TOKEN_ENDPOINT` | `https://oauth2.googleapis.com/token` | Google OAuth 2.0 token endpoint |
| `CACHE_KEY` | `sheets_access_token` | KV / in-memory token cache key |
| `CACHE_MARGIN_SEC` | `60` | 期限切れ60秒前から再取得 |

### エラーハンドリング

| ケース | 挙動 |
| --- | --- |
| `GOOGLE_SERVICE_ACCOUNT_JSON` が JSON として壊れている | `SheetsAuthError("Invalid GOOGLE_SERVICE_ACCOUNT_JSON: parse failed")` |
| Service Account key ではない JSON | `SheetsAuthError("Invalid GOOGLE_SERVICE_ACCOUNT_JSON: not a service_account key")` |
| PEM private key の import に失敗 | `SheetsAuthError("Failed to import private key")` |
| Token Endpoint が 4xx / 5xx | `SheetsAuthError("Token endpoint returned ...")` |
| token response に `access_token` がない | `SheetsAuthError("Missing access_token in response")` |

エラーメッセージには private key や access token を含めません。

### エッジケース

| ケース | 対応 |
| --- | --- |
| KV binding がない | module-scoped in-memory cache に fallback |
| キャッシュの残り有効期限が60秒以下 | 新しい token を取得 |
| Workers isolate が再起動する | in-memory cache は失われるため、次回 token を再取得 |
| 実 API 疎通に Service Account が必要 | Phase 12 の未タスクとして、ユーザーの secret 配置後に確認 |
| Sheets データ読み書き | UT-09 の責務として分離 |

### 検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/integrations test:run -- sheets-auth
mise exec -- pnpm --filter @ubm-hyogo/integrations typecheck
```

確認済み結果:

```text
Test Files  1 passed (1)
Tests  12 passed (12)
```

### 下流タスクへの影響

| 下流タスク | 影響 |
| --- | --- |
| UT-09 (Sheets to D1 sync job) | `getAccessToken(env)` を使って Sheets API を呼び出せる |
| 03-serial-data-source-and-storage-contract | Sheets API 認証基盤を前提にデータソース契約を設計できる |

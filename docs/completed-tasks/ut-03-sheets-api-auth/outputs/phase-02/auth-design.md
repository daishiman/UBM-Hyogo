# Sheets API 認証フロー設計

## 認証フロー概要

```
Cloudflare Workers
  └─ getAccessToken(env)
       ├─ キャッシュチェック（TTL > 60s → cached token 返却）
       └─ キャッシュ無効時:
            ├─ parseServiceAccountKey(env.GOOGLE_SERVICE_ACCOUNT_JSON)
            ├─ importPrivateKey(sa.private_key)  ← Web Crypto API
            ├─ createSignedJWT(key, payload)     ← RS256 署名
            ├─ POST https://oauth2.googleapis.com/token
            └─ access_token をキャッシュして返却
```

## JWT ペイロード仕様

| フィールド | 値 | 説明 |
| --- | --- | --- |
| `iss` | `<service_account_email>` | Service Account のメールアドレス |
| `scope` | `https://www.googleapis.com/auth/spreadsheets.readonly` | 最小権限スコープ |
| `aud` | `https://oauth2.googleapis.com/token` | Token Endpoint |
| `iat` | `Math.floor(Date.now() / 1000)` | 発行時刻（Unix秒） |
| `exp` | `iat + 3600` | 有効期限（1時間後） |

## JWT ヘッダー仕様

| フィールド | 値 |
| --- | --- |
| `alg` | `RS256` |
| `typ` | `JWT` |

## PEM → DER 変換手順

```
1. PEM 文字列から `-----BEGIN PRIVATE KEY-----` と `-----END PRIVATE KEY-----` を除去
2. 改行文字（\n）を除去
3. Base64 デコードして ArrayBuffer（DER バイナリ）に変換
4. crypto.subtle.importKey('pkcs8', derBuffer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
```

## シーケンス図

```
Caller            sheets-auth.ts         Cache              Crypto              Google Token EP
  |                    |                   |                   |                      |
  |─getAccessToken()──>|                   |                   |                      |
  |                    |─キャッシュ確認──>|                   |                      |
  |              [キャッシュ有効]          |                   |                      |
  |                    |<─cached token────|                   |                      |
  |<──access_token─────|                   |                   |                      |
  |                    |                   |                   |                      |
  |              [キャッシュ無効]          |                   |                      |
  |                    |──────────────────────importKey(PEM)─>|                      |
  |                    |<────────────────────CryptoKey────────|                      |
  |                    |──────────────────────sign(JWT)───────>|                      |
  |                    |<────────────────────signature─────────|                      |
  |                    |────────────────────────────────────────POST /token──────────>|
  |                    |<───────────────────────────────────────access_token + exp────|
  |                    |─store(token, TTL)─>|                   |                      |
  |<──access_token─────|                   |                   |                      |
```

## 公開インターフェース定義

```typescript
export interface SheetsAuthEnv {
  GOOGLE_SERVICE_ACCOUNT_JSON: string;
  SHEETS_TOKEN_CACHE?: KVNamespace;
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
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "SheetsAuthError";
  }
}

export async function getAccessToken(env: SheetsAuthEnv): Promise<AccessTokenResult>;
export async function importPrivateKey(pemKey: string): Promise<CryptoKey>;
export async function createSignedJWT(key: CryptoKey, payload: Record<string, unknown>): Promise<string>;
```

## キャッシュ戦略

| ストレージ | 条件 | 動作 |
| --- | --- | --- |
| Workers KV | `SHEETS_TOKEN_CACHE` binding が存在する場合 | TTL 付きで KV に保存（Worker インスタンス跨ぎで共有） |
| in-memory | `SHEETS_TOKEN_CACHE` binding が存在しない場合 | module-scoped 変数に保存（同一 Worker インスタンス内のみ） |

- キャッシュキー: `sheets_access_token`
- 再取得トリガー: `Date.now() / 1000 > expiresAt - 60`（残り 60秒以下で再取得）

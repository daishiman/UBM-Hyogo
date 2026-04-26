# sheets-auth.ts 実装仕様書

## 概要

| 項目 | 内容 |
| --- | --- |
| 配置パス | `packages/integrations/src/sheets-auth.ts` |
| ランタイム | Cloudflare Workers (Edge Runtime) |
| 署名方式 | Web Crypto API (`crypto.subtle.importKey` / `crypto.subtle.sign`) |
| 認証スコープ | `https://www.googleapis.com/auth/spreadsheets.readonly` |
| トークン TTL | 3600秒（1時間） |
| キャッシュ | module-scoped in-memory + Workers KV（binding 時） |

## 公開 API

```typescript
// シークレット管理型
export interface SheetsAuthEnv {
  GOOGLE_SERVICE_ACCOUNT_JSON: string;
  SHEETS_TOKEN_CACHE?: KVNamespace;
}

// トークン結果型
export interface AccessTokenResult {
  accessToken: string;
  expiresAt: number;  // Unix タイムスタンプ（秒）
}

// エラークラス
export class SheetsAuthError extends Error { ... }

// メイン関数（下流から使用）
export async function getAccessToken(env: SheetsAuthEnv): Promise<AccessTokenResult>;

// 内部ユーティリティ（テスト可能なよう export）
export async function importPrivateKey(pemKey: string): Promise<CryptoKey>;
export async function createSignedJWT(key: CryptoKey, payload: Record<string, unknown>): Promise<string>;

// テスト用
export function _resetMemoryCache(): void;
```

## JWT 生成フロー

```
1. GOOGLE_SERVICE_ACCOUNT_JSON を JSON.parse する
2. private_key (PEM) から PEM ヘッダー/フッター・改行を除去
3. atob() で Base64 デコード → Uint8Array（DER バイナリ）
4. crypto.subtle.importKey('pkcs8', derBuffer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
5. header（RS256/JWT）と payload（iss/scope/aud/iat/exp）を base64url エンコード
6. crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, signingInput) で署名
7. header.payload.signature の JWT 文字列を作成
8. Google OAuth2 Token Endpoint に POST して access_token を取得
9. キャッシュに保存（KV or in-memory）
```

## エラーハンドリング

| エラー原因 | スローするエラー |
| --- | --- |
| JSON parse 失敗 | `SheetsAuthError('Invalid GOOGLE_SERVICE_ACCOUNT_JSON: parse failed')` |
| PEM インポート失敗 | `SheetsAuthError('Failed to import private key')` |
| Token Endpoint 4xx/5xx | `SheetsAuthError('Token endpoint returned <status>: <body>')` |
| access_token フィールド欠損 | `SheetsAuthError('Missing access_token in response')` |

**秘密鍵・トークン値はエラーメッセージに含めない**

## テスト実行結果

```
✓ packages/integrations/src/sheets-auth.test.ts (10 tests)
  ✓ AUTH-01: PEM key import (2 tests)
  ✓ AUTH-02: base64url / JWT claim (1 test)
  ✓ AUTH-03: token endpoint mock (2 tests)
  ✓ AUTH-04: TTL cache (1 test)
  ✓ AUTH-05: KV fallback (2 tests)
  ✓ AUTH-06: secret redaction (2 tests)

Test Files  1 passed (1)
Tests  10 passed (10)
```

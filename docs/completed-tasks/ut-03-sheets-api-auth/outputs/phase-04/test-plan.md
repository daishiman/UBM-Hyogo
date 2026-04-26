# Phase 4: テスト計画（AUTH-01〜AUTH-06）

## テスト対象

`packages/integrations/src/sheets-auth.ts`

## テスト実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/integrations test:run
```

## テストケース一覧

| Test ID | 対象関数 | 検証内容 | 期待値 |
| --- | --- | --- | --- |
| AUTH-01 | `importPrivateKey` | Service Account JSON の `private_key` を DER へ変換し Web Crypto API にインポートできる | `crypto.subtle.importKey` が成功し `CryptoKey` を返す |
| AUTH-01b | `importPrivateKey` | 不正な PEM を渡すと `SheetsAuthError` をスローする | `SheetsAuthError: Failed to import private key` |
| AUTH-02 | `createSignedJWT` | JWT header/payload が RS256・scope・aud・iat・exp を含む | 3部構成の JWT、header.alg === 'RS256'、payload にスコープ等が含まれる |
| AUTH-03 | `getAccessToken` | `fetch` mock で `access_token` / `expires_in` を受け取れる | accessToken が返り、fetch が1回呼ばれる |
| AUTH-03b | `getAccessToken` | token endpoint が 4xx を返すと `SheetsAuthError` をスローする | `SheetsAuthError` に 401 のステータスが含まれる |
| AUTH-04 | `getAccessToken` | 有効期限内の再呼び出しで token endpoint を再実行しない | 2回目は cached token を返す、fetch は1回のみ |
| AUTH-05 | `getAccessToken` | KV 未設定時は module-scoped in-memory cache に退避する | runtime binding なしでも動作し、fetch は1回のみ |
| AUTH-05b | `getAccessToken` | KV binding がある場合は KV にキャッシュを保存する | `kv.put` が呼ばれ、KV にトークンが保存される |
| AUTH-06 | `getAccessToken` | 不正な JSON でエラーが発生しても秘密鍵が error message に含まれない | error message に "BEGIN PRIVATE KEY" や "ya29." が含まれない |
| AUTH-06b | `getAccessToken` | token endpoint エラーで access_token が error message に含まれない | error message に "ya29." が含まれない |

## 実装場所

`packages/integrations/src/sheets-auth.test.ts`

## テスト結果

全 10 テスト PASS（2026-04-26 実施）

# Phase 12: 実装ガイド

## Part 1: 中学生レベルの説明

### このタスクで何をしているの?

UBM 兵庫支部会のメンバー情報は Google Form に書き込まれて Google スプレッドシートに集まります。これを私たちのアプリ（Cloudflare で動いている）が読みに行くために、**「このアプリは正規のお客さんですよ」と Google に証明する仕組み**を作るのがこのタスクです。

### 鍵束のたとえ

- **Service Account（サービスアカウント）** = アプリ専用の鍵束
- **JSON キー** = その鍵束に入っている合鍵そのもの
- **JWT 署名** = 「この合鍵は本物だよ」と Google に提出する一筆
- **Access Token** = 受付で「OK」と言われた後にもらえる入館証（1 時間で期限切れ）
- **TTL 1 時間キャッシュ** = 入館証は毎回もらいに行くと受付が混むので、もらった入館証を 1 時間メモして使い回す

### なぜ Service Account を選んだの?

人間が毎回ログインするのは大変だし、夜中に Cloudflare が自動で同期したいときに「人間 寝てるから無理」になります。Service Account ならアプリ自身が自分で鍵を出して入れます。

### なぜ秘密にするの?

合鍵を落とすと誰でも私たちのスプレッドシートを読めてしまうので、**秘密の場所（Cloudflare Secrets と 1Password）にしか置きません**。GitHub にも `.env` にも実物は置かない。AI（Claude Code）にも見せない。

## Part 2: 技術者レベルの説明

### アーキテクチャ

```
apps/api (Cloudflare Workers, Edge Runtime)
  └─ packages/integrations/google/src/sheets/auth.ts
       ├─ parseServiceAccountJson(env)        : Zod schema validation + JSON parse
       ├─ signJwt(claim, privateKey)          : Web Crypto API RS256 sign
       ├─ exchangeJwtForAccessToken(jwt)      : POST oauth2.googleapis.com/token
       └─ getSheetsAccessToken(env): closure cache (TTL 1h, refresh 5min before)
```

### 採択方式: Service Account JSON key + Web Crypto JWT

| 項目 | 採用 | 不採用 |
| --- | --- | --- |
| 認証方式 | Service Account JSON key | OAuth 2.0 (user consent flow) |
| JWT 署名 | Web Crypto API (RS256) | google-auth-library（Node API 依存で Workers 非互換） |
| キャッシュ | in-memory closure (TTL 1h, refresh 5min before) | KV / D1 永続化（YAGNI） |
| Secret | `GOOGLE_SERVICE_ACCOUNT_JSON` (Cloudflare Secrets, 1Password ref) | `.env` 平文 |

### Edge Runtime 互換ポイント

- `crypto.subtle.importKey('pkcs8', ...)` で PKCS#8 PEM の改行 (`\n` → 実改行) を正規化
- `crypto.subtle.sign('RSASSA-PKCS1-v1_5', ...)` で RS256 署名
- `fetch` のみ使用（`https`/`node:crypto` 不使用）

### 公開 API（契約）

```ts
export type SheetsAuthEnv = {
  GOOGLE_SERVICE_ACCOUNT_JSON: string;
  SHEETS_SCOPES?: string;
};
export function getSheetsAccessToken(env: SheetsAuthEnv): Promise<{ accessToken: string; expiresAt: number }>;
```

下流（UT-09 / UT-21）はこの shape のみを依存対象とする。変更時は major bump。

### 異常系（Phase 6 抜粋）

- F-1 JSON parse 失敗 → fail-fast、redact
- F-5 Sheets 未共有 → 403 PERMISSION_DENIED、Phase 5 ステップ 3 へ
- F-6/F-7 429/5xx → exponential backoff（1s/2s/4s）

### Secret 配置

```
1Password → .env (op:// 参照のみ) → bash scripts/with-env.sh で実行時注入
1Password → bash scripts/cf.sh secret put → Cloudflare Secrets (dev/staging/production)
```

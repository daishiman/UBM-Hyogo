# Phase 12: 実装ガイド

## Part 1: 中学生レベルの概念説明

### 何を作ろうとしているか

このプロジェクトでは、ホームページが「ちゃんと動いているか」を毎日チェックする仕組みを作っています。これを **スモークテスト** と呼びます。お風呂の煙感知器のように、「異常」だけを素早く検知する仕組みです。

### 何が困っていたか

スモークテストを動かすには、ホームページに「私は admin（管理人）です」「私は member（会員）です」と名乗るための **入館証**（プログラムの世界では「トークン」と呼びます）が必要でした。

ところが、いままで使っていた入館証は **30 分で期限切れ**してしまうものでした。チェックを動かすたびに新しい入館証を取り直す必要があり、人がいないと回せませんでした。さらに、本番（production）のチェック自体が「まだ仕組みすら無い」状態でした。

### どう直すか

1. **長持ちする入館証を発行する窓口** を新しく作ります。90 日有効です。本物の会員向け入館証とは別の経路にして、間違って混ざらないようにします。
2. **本番もチェックできるようにする**。ただし本番では「見るだけ」（read-only）に限定して、データを壊さないようにします。
3. **必要な情報がちゃんと用意されているか、事前に確認する仕組み** を本番にも広げます。staging（リハーサル環境）と本番で同じ書き方になります。
4. **手順書を整える**。チェックを回すために何を投入すればいいか、データベースの更新をどうやるか、入館証はどう発行するかを、迷わず辿れる地図にします。

### なぜ大事か

人がいなくても毎日チェックが回るようになると、不具合が出たときにすぐ気付けます。今までは「気付いた人が手で対応する」状態だったので、見落としや遅延が起きやすかったのです。

### たとえ話

学校の警備員さんが、夜中に校舎を見回るときに使う「マスターキー」を想像してください。

- 今までのキー: 30 分で鍵が変わる暗証錠だった → 警備員さんが校舎に入る前に毎回鍵を取り直す必要があった
- 新しいキー: 90 日有効な専用キー。受付に登録した警備員さんだけが受け取れる。誰がいつ受け取ったかは記録ノート（監査ログ）に残る
- 見守り対象: いままで「本館」だけだった → 「別館（本番）」も追加。ただし別館では「鍵を開けて中を覗く」だけで、物を動かしたり捨てたりはしない

これと同じ仕組みを、Web の世界で作ろうとしているのが本タスクです。

---

## Part 2: 開発者レベルの技術詳細

### システム構成

```
[GitHub Actions]
    │ runtime-smoke-{staging,production}.yml
    ▼
[verify-env-secrets.sh]  ← allowlist で必須 secret 宣言を検査
    │ PASS
    ▼
[runtime-attendance-provider.sh]
    │ ENV={staging|production} / SMOKE_READONLY={0|1}
    ▼
[Cloudflare Workers: apps/api]
    ├── /healthz, /api/me, /api/members, ...（既存）
    └── /internal/service-token/{admin,member}（本タスクで新設）
            │ HMAC verify → 90日 JWT 発行
            ▼
        [D1: audit_log]（発行記録）
```

### service-token endpoint API

#### TypeScript 型定義

```ts
// apps/api/src/routes/internal/service-token.ts
export interface ServiceTokenRequest {
  kid: string;          // 事前登録された発行クライアント識別子
  ts: number;           // unix epoch (sec); ±300秒許容
  nonce: string;        // UUID v4; 600秒 TTL で重複拒否
}

export interface ServiceTokenResponse {
  token: string;        // JWT
  exp: number;          // unix epoch (sec); iat + 90*24*3600
  role: "admin" | "member";
  sub: string;          // seed user の固定 ID
}

export interface ServiceTokenError {
  error: "invalid_request" | "unauthorized" | "nonce_replayed" | "rate_limited" | "internal";
  reason?: string;
  retry_after?: number;
}
```

#### 使用例（HMAC 署名生成 / 検証）

```ts
// 発行側（CI / runbook で使用）
const ts = Math.floor(Date.now() / 1000);
const nonce = crypto.randomUUID();
const kid = "ci-production-smoke";
const role = "admin";
const payload = `${kid}.${ts}.${nonce}.${role}`;
const sig = await hmacSha256Hex(SERVICE_TOKEN_SHARED_SECRET, payload);

const res = await fetch(`${API_BASE}/internal/service-token/${role}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Service-Token-Signature": sig,
  },
  body: JSON.stringify({ kid, ts, nonce }),
});
```

#### JWT claim

| claim | 値 | 用途 |
|-------|----|------|
| `sub` | seed user ID（`SMOKE_ADMIN_USER_ID` / `SMOKE_MEMBER_USER_ID`） | 認可判定の固定主体 |
| `role` | `"admin"` / `"member"` | role-based 認可 |
| `iat` | unix epoch (sec) | 発行時刻 |
| `exp` | `iat + 90*24*3600` | 90日有効 |
| `jti` | UUID v4 | 個別 JWT 識別子（revoke 用） |
| `iss` | `ubm-hyogo-api-{env}` | issuer |
| `aud` | `ci-smoke` | audience |

#### Rate limit

- `kid` あたり 10 req / hour
- 超過時 429 + `retry_after`（秒）

#### エラーハンドリング

| status | エラー | 検知シグナル |
|--------|--------|------------|
| 400 | `invalid_request` | `reason` フィールドで詳細特定 |
| 401 | `unauthorized` | HMAC 不正 / kid 未登録（区別なし、攻撃者へのヒント漏洩防止） |
| 409 | `nonce_replayed` | nonce 重複 |
| 429 | `rate_limited` | `retry_after` を尊重して再試行 |
| 500 | `internal` | `JWT_SIGNING_KEY` 等の environment 不備 |

### 設定可能パラメータ（Cloudflare Secret / wrangler vars）

| 名前 | 種別 | 用途 |
|------|------|------|
| `SERVICE_TOKEN_SHARED_SECRET` | Secret | HMAC 共有秘密 |
| `JWT_SIGNING_KEY` | Secret | JWT 署名鍵（Auth.js とは分離） |
| `SERVICE_TOKEN_REGISTERED_KIDS` | var | カンマ区切りの kid 許可リスト |
| `SMOKE_ADMIN_USER_ID` | var | admin seed user の固定 ID |
| `SMOKE_MEMBER_USER_ID` | var | member seed user の固定 ID |
| `SERVICE_TOKEN_NONCE_KV` | KV binding | nonce 重複検査 / rate limit |

### smoke runner 拡張

```bash
# scripts/smoke/runtime-attendance-provider.sh の env 分岐（疑似コード）
case "${ENV}" in
  staging)
    API_BASE="${STAGING_API_BASE}"
    ADMIN_BEARER="${STAGING_ADMIN_BEARER}"
    ME_BEARER="${STAGING_ME_BEARER}"
    MEMBER_ID="${STAGING_MEMBER_ID}"
    SMOKE_READONLY="${SMOKE_READONLY:-0}"
    ;;
  production)
    API_BASE="${PROD_API_BASE}"
    ADMIN_BEARER="${PROD_ADMIN_BEARER}"
    ME_BEARER="${PROD_ME_BEARER}"
    MEMBER_ID="${PROD_MEMBER_ID}"
    SMOKE_READONLY=1  # 強制 readonly
    ;;
  *)
    echo "ENV must be staging or production" >&2; exit 1 ;;
esac
```

### production workflow（概要）

```yaml
# .github/workflows/runtime-smoke-production.yml
on:
  workflow_dispatch:
  schedule:
    - cron: '0 18 * * *'  # 03:00 JST 相当（UTC 18:00）
  workflow_call:
jobs:
  smoke:
    environment: production-runtime-smoke
    steps:
      - uses: actions/checkout@v4
      - run: bash scripts/ci/verify-env-secrets.sh production-runtime-smoke
      - run: bash scripts/smoke/runtime-attendance-provider.sh
        env:
          ENV: production
          SMOKE_READONLY: 1
          PROD_API_BASE: ${{ secrets.PROD_API_BASE }}
          PROD_ADMIN_BEARER: ${{ secrets.PROD_ADMIN_BEARER }}
          PROD_ME_BEARER: ${{ secrets.PROD_ME_BEARER }}
          PROD_MEMBER_ID: ${{ secrets.PROD_MEMBER_ID }}
```

### allowlist 拡張

```
# scripts/ci/verify-env-secrets.allowlist
staging-runtime-smoke: STAGING_API_BASE STAGING_ADMIN_BEARER STAGING_MEMBER_ID STAGING_ME_BEARER
production-runtime-smoke: PROD_API_BASE PROD_ADMIN_BEARER PROD_MEMBER_ID PROD_ME_BEARER
```

### 視覚証跡

UI/UX 変更なしのため Phase 11 スクリーンショット不要。代替証跡は `outputs/phase-11/manual-test-result.md`（spec レビューチェックリスト + 静的検証）と `outputs/phase-04/test-plan.md`（自動テスト計画 39 件）。

### エッジケース

| ケース | 挙動 |
|--------|------|
| `SERVICE_TOKEN_SHARED_SECRET` 未設定 | 起動時 throw（503 でユーザーには露出させない） |
| `JWT_SIGNING_KEY` 未設定 | 500 + 監査ログ記録 |
| KV namespace 未配線 | 500 + ログ警告 |
| `kid` の typo | 401（kid 未登録と HMAC 不正は区別しない） |
| ts skew | 400 / `reason=ts_skew` |
| nonce 重複 | 409 |
| rate limit 超過 | 429 + `retry_after` |
| production で write メソッド試行 | smoke runner 側で skip（API 側は通常認可） |

# Phase 2: 設計

## 1. service-token endpoint

### 1.1 Route

| Method | Path | 用途 |
|--------|------|------|
| POST | `/internal/service-token/admin` | admin 役割の長寿命 JWT 発行（CI smoke の admin bearer） |
| POST | `/internal/service-token/member` | member 役割の長寿命 JWT 発行（CI smoke の me bearer） |

- 配置先: `apps/api/src/routes/internal/service-token.ts`
- mount: `apps/api/src/index.ts` の Hono ルーターに `app.route('/internal/service-token', serviceTokenRoute)` を追加
- 公開可視性: **internal**（Cloudflare Workers 経由でアクセス可だが、HMAC protection により発行は認可済みクライアントのみ）

### 1.2 HMAC 保護方式

| 要素 | 仕様 |
|------|------|
| アルゴリズム | HMAC-SHA256 |
| 共有秘密 | `SERVICE_TOKEN_SHARED_SECRET`（Cloudflare Secret として `apps/api` の wrangler 環境に投入） |
| 署名対象文字列 | `${kid}.${ts}.${nonce}.${role}`（role は path から導出: `admin` / `member`） |
| 署名ヘッダ | `X-Service-Token-Signature: <hex(hmac_sha256(secret, payload))>` |
| タイムスタンプ許容範囲 | `±300秒`（ts は unix epoch sec） |
| nonce | UUID v4 推奨、長さ 16〜64 文字、英数字とハイフンのみ許容 |
| 重複防止 | KV ベースで `nonce` を 600 秒 TTL で記録し、同一 nonce の再利用は 409 で拒否 |

### 1.3 入出力

#### Request body (JSON)

```json
{
  "kid": "<key-id>",
  "ts": 1747500000,
  "nonce": "<uuid-v4>"
}
```

| field | type | 必須 | 説明 |
|-------|------|------|------|
| `kid` | string | yes | 発行クライアント識別子（`ci-staging-smoke` / `ci-production-smoke` 等の事前登録値） |
| `ts` | number | yes | unix epoch (sec)。`abs(now - ts) > 300` は 400 |
| `nonce` | string | yes | リプレイ防止用 UUID。重複は 409 |

#### Response 200 (JSON)

```json
{
  "token": "<jwt>",
  "exp": 1755276000,
  "role": "admin",
  "sub": "<fixed-member-id>"
}
```

| field | type | 説明 |
|-------|------|------|
| `token` | string | 発行された JWT（90 日有効） |
| `exp` | number | unix epoch (sec)。`iat + 90*24*3600` |
| `role` | string | `admin` または `member` |
| `sub` | string | 固定 member/admin ID（seed user の ID） |

#### エラー応答

| status | 条件 | body |
|--------|------|------|
| 400 | ts skew > 300, nonce 不正, body parse 失敗 | `{ "error": "invalid_request", "reason": "..." }` |
| 401 | HMAC 検証失敗, kid 未登録 | `{ "error": "unauthorized" }` |
| 409 | nonce 重複 | `{ "error": "nonce_replayed" }` |
| 429 | rate limit 超過 | `{ "error": "rate_limited", "retry_after": <sec> }` |
| 500 | 内部エラー | `{ "error": "internal" }` |

### 1.4 JWT claim

| claim | 値 |
|-------|----|
| `sub` | seed user の固定 ID（admin: `SMOKE_ADMIN_USER_ID`、member: `SMOKE_MEMBER_USER_ID`） |
| `role` | `admin` または `member` |
| `iat` | 発行時刻 unix epoch (sec) |
| `exp` | `iat + 90 * 24 * 3600`（90 日） |
| `jti` | UUID v4（個別 JWT 識別子、監査・revoke 用） |
| `iss` | `ubm-hyogo-api-{env}`（env: staging / production） |
| `aud` | `ci-smoke` |

JWT 署名鍵は `JWT_SIGNING_KEY`（既存 Auth.js 用秘密鍵とは **分離**）。Cloudflare Secret として `apps/api` に投入。

### 1.5 Rate limit

- 同一 `kid` あたり **10 req / hour**
- Cloudflare KV（または D1 のいずれか軽量側）で `kid` ごとに発行履歴を保持し、sliding window で判定
- 超過時は 429 + `retry_after` 秒数を返す

### 1.6 監査

- `audit_log` テーブル（既存）に以下を記録:
  - `actor`: `service-token-issuer:<kid>`
  - `action`: `issue_service_token`
  - `target`: `<sub>`
  - `metadata`: `{ "role": "...", "jti": "...", "exp": ... }`（**secret 値は含めない**）
- 失敗 (401 / 409 / 429) も `action: issue_service_token_failed` で記録

### 1.7 共有モジュール

| ファイル | 責務 |
|---------|------|
| `apps/api/src/lib/hmac.ts` | `verifyHmacSignature(payload, signature, secret)` を export。timing-safe 比較必須 |
| `apps/api/src/lib/service-token-audit.ts` | `logServiceTokenIssue(...)` / `logServiceTokenFailure(...)` を export |

## 2. smoke runner 拡張

### 2.1 対象

`scripts/smoke/runtime-attendance-provider.sh`

### 2.2 拡張内容

| 項目 | 変更 |
|------|------|
| staging-only ガード | `if [ "${ENV}" = "staging" ]; then ... else return 0; fi` 形式の早期 return を解除 |
| env 分岐 | `case "${ENV}" in staging) ... ;; production) ... ;; *) echo "unknown env"; exit 1 ;; esac` |
| read-only ガード | `SMOKE_READONLY` 環境変数を導入。production では `SMOKE_READONLY=1` を強制。`SMOKE_READONLY=1` のとき write 系 endpoint（POST / PUT / DELETE）への curl を skip |
| API base 切替 | `STAGING_API_BASE` / `PROD_API_BASE` を env から引く |
| bearer 切替 | `STAGING_ADMIN_BEARER` / `STAGING_ME_BEARER` / `PROD_ADMIN_BEARER` / `PROD_ME_BEARER` を env から引く |
| member id 切替 | `STAGING_MEMBER_ID` / `PROD_MEMBER_ID` を env から引く |

### 2.3 production read-only ルート（許可リスト）

| Method | Path | 用途 |
|--------|------|------|
| GET | `/healthz` | liveness |
| GET | `/api/me` | member 自分情報（read） |
| GET | `/api/members` | 公開ディレクトリ |
| GET | `/api/members/:id` | 公開メンバー詳細 |
| GET | `/api/admin/audit?limit=1` | 監査ログ tail（admin read のみ） |

> POST / PUT / DELETE は production では全て skip。staging では従来通り attendance 系 write を実行。

## 3. production workflow

### 3.1 ファイル

`.github/workflows/runtime-smoke-production.yml`（新設）

### 3.2 staging 版との差分

| 項目 | staging | production |
|------|---------|-----------|
| trigger | `workflow_call` from `backend-ci` (push to dev) | `workflow_call` from `deploy-production` または `workflow_dispatch`、`schedule: cron '0 3 * * *'`（毎日 03:00 JST） |
| environment | `staging-runtime-smoke` | `production-runtime-smoke` |
| 必須 secret | `STAGING_API_BASE` / `STAGING_ADMIN_BEARER` / `STAGING_MEMBER_ID` / `STAGING_ME_BEARER` | `PROD_API_BASE` / `PROD_ADMIN_BEARER` / `PROD_MEMBER_ID` / `PROD_ME_BEARER` |
| smoke runner 呼び出し | `ENV=staging bash scripts/smoke/runtime-attendance-provider.sh` | `ENV=production SMOKE_READONLY=1 bash scripts/smoke/runtime-attendance-provider.sh` |
| 失敗時通知 | `SLACK_WEBHOOK_INCIDENT`（既存） | 同上（`production-runtime-smoke` Environment scope） |

### 3.3 steps（概略）

1. `actions/checkout`
2. `pnpm install --frozen-lockfile`（Node 24 + pnpm 10 を mise で固定）
3. `bash scripts/ci/verify-env-secrets.sh production-runtime-smoke`（preflight gate）
4. `bash scripts/smoke/runtime-attendance-provider.sh`（ENV / SMOKE_READONLY を env で渡す）
5. 失敗時 Slack 通知

## 4. allowlist 拡張

### 4.1 ファイル

`scripts/ci/verify-env-secrets.allowlist`

### 4.2 追加行（既存 staging 行の直下）

```
production-runtime-smoke: PROD_API_BASE PROD_ADMIN_BEARER PROD_MEMBER_ID PROD_ME_BEARER
```

### 4.3 既存 verify-env-secrets.sh の挙動

- 第 1 引数で渡された environment 名で allowlist を grep し、必須 key を name-only で `gh api` から取得して欠落を検出
- 本タスクではコアロジックは変更せず、allowlist の宣言行を追加するのみ

## 5. provision script

### 5.1 リネーム

`scripts/smoke/provision-staging-secrets.sh` → `scripts/smoke/provision-runtime-smoke-secrets.sh`

### 5.2 env 引数化

- 第 1 引数で `staging` / `production` を受ける
- 引数なし / 不正値は usage 表示 + exit 1
- 1Password 経路（`op run`）と直接 `gh secret set` 経路の両方をサポートする `--mode op|gh` フラグを追加

### 5.3 旧パスからの参照断ち切り

- 旧パスを使う caller（runbook / workflow / CI ジョブ）を grep で洗い出し、新名称に統一
- 旧パスは symlink 残しではなく、git 削除する

## 6. allowlist と production workflow の整合性

| 項目 | 値 |
|------|----|
| Environment 名 | `production-runtime-smoke`（GitHub UI で先に作成、user 操作） |
| 必須 secret 4 件 | `PROD_API_BASE` / `PROD_ADMIN_BEARER` / `PROD_MEMBER_ID` / `PROD_ME_BEARER` |
| 任意 secret | `SLACK_WEBHOOK_INCIDENT`（既存設計と同様） |

## 7. 依存関係 / 責務境界

| レイヤ | 責務 | 所有者 |
|--------|------|--------|
| API（service-token） | HMAC 検証・JWT 発行・監査記録 | `apps/api` 単独 |
| smoke runner | env 分岐・bearer 適用・read-only ガード | `scripts/smoke/` 単独 |
| CI workflow | preflight gate / smoke runner 起動 / 通知 | `.github/workflows/` |
| allowlist | environment scope の必須 key 宣言 | `scripts/ci/` |
| provision | secret 投入手順の実行 | `scripts/smoke/` + user 操作 |
| runbook | ops 手順の正本化 | `docs/30-workflows/runtime-smoke-env-provisioning/runbooks/` |

## 8. ライブラリ採用

- HMAC: Web Crypto API（`crypto.subtle.importKey` + `crypto.subtle.sign`）。Workers runtime 標準。
- JWT: `hono/jwt` または `@tsndr/cloudflare-worker-jwt`（既存 Auth.js JWT との衝突回避のため、サブ署名鍵は分離）
- nonce 永続化: Cloudflare KV（既存 binding を流用 / または新規 KV namespace 追加）

## 完了条件

- service-token endpoint / smoke runner 拡張 / production workflow / allowlist 拡張 / provision script rename の全仕様が本ファイルに記述されている
- HMAC scheme / JWT claim / rate limit / 監査の各仕様が AC-1〜AC-5 を満たす粒度で記述されている

## 成果物

- `outputs/phase-02/design.md`（本ファイル）

## 次 Phase 入力

- Phase 3: 本設計が AC を満たすかのレビュー判定
- Phase 4: service-token endpoint の単体 / 統合テスト計画、allowlist verify テスト、smoke runner spec テスト

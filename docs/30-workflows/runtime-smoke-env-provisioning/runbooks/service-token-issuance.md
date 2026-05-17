# runbook: service-token 発行手順

## 目的

CI smoke 用の長寿命 JWT（90 日有効）を `apps/api` の service-token endpoint 経由で発行する。

> 全手順 user-gated。発行された JWT は **クリップボード or 1Password に直接保存**し、ターミナル履歴 / シェルログ / Slack に貼り付けない。

## 前提

- service-token endpoint が `apps/api` にデプロイ済み（staging / production の対象環境ごと）
- `SERVICE_TOKEN_SHARED_SECRET` / `SERVICE_TOKEN_REGISTERED_KIDS` / `JWT_SIGNING_KEY` / `SMOKE_ADMIN_USER_ID` / `SMOKE_MEMBER_USER_ID` が当該 worker 環境に投入済み
- KV namespace `SERVICE_TOKEN_NONCE_KV` が binding 済み

## 0. seed user 投入（初回のみ・user-gated）

admin / member の固定 ID を持つ seed user を D1 に投入する。

```bash
# staging
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "INSERT INTO users (id, role, email, name) VALUES ('<SMOKE_ADMIN_USER_ID>', 'admin', 'smoke-admin@example.invalid', 'smoke-admin') ON CONFLICT(id) DO NOTHING;"

bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "INSERT INTO users (id, role, email, name) VALUES ('<SMOKE_MEMBER_USER_ID>', 'member', 'smoke-member@example.invalid', 'smoke-member') ON CONFLICT(id) DO NOTHING;"

# production も同様（--env production / ubm-hyogo-db-prod）
```

> 実 ID 値は 1Password (`op://UBM-Hyogo/<env>-runtime-smoke/smoke-admin-user-id` 等) に保管し、コマンド実行時に `op read` で動的取得する。

## 1. HMAC 署名で発行リクエスト

### kid

| 環境 | 推奨 kid |
|------|---------|
| staging | `ci-staging-smoke` |
| production | `ci-production-smoke` |

事前に `SERVICE_TOKEN_REGISTERED_KIDS` 環境変数（カンマ区切り）に追加されていること。

### 発行スクリプト（推奨）

```bash
# scripts/smoke/issue-service-token.sh の utility（user-gated 実行）
ENV=staging ROLE=admin KID=ci-staging-smoke \
  op run --env-file=.env -- bash scripts/smoke/issue-service-token.sh
```

`scripts/smoke/issue-service-token.sh` は以下を行う:

1. `op read op://UBM-Hyogo/<env>-api/SERVICE_TOKEN_SHARED_SECRET` で共有秘密を取得（環境変数経由・stdout 出力なし）
2. `ts = $(date +%s)`, `nonce = $(uuidgen)`
3. `payload = "${kid}.${ts}.${nonce}.${role}"`
4. `sig = printf '%s' "$payload" | openssl dgst -sha256 -hmac "$SECRET" -hex | awk '{print $2}'`
5. curl で `POST <api-base>/internal/service-token/<role>`
6. レスポンスの `.token` を `pbcopy`（macOS）で **クリップボードに直接**コピー、`.exp` のみ標準出力に表示

### 手動 curl の場合（参考）

```bash
# user 操作で 1Password から secret / api-base を環境変数に注入してから実行
TS=$(date +%s)
NONCE=$(uuidgen)
KID=ci-staging-smoke
ROLE=admin
PAYLOAD="${KID}.${TS}.${NONCE}.${ROLE}"
SIG=$(printf '%s' "$PAYLOAD" | openssl dgst -sha256 -hmac "$SERVICE_TOKEN_SHARED_SECRET" -hex | awk '{print $2}')

curl -sS -X POST "${API_BASE}/internal/service-token/${ROLE}" \
  -H 'Content-Type: application/json' \
  -H "X-Service-Token-Signature: ${SIG}" \
  -d "{\"kid\":\"${KID}\",\"ts\":${TS},\"nonce\":\"${NONCE}\"}" \
  | jq -r '.token' | pbcopy
```

## 2. 1Password に保存

```bash
op item edit "<env>-runtime-smoke" --vault "UBM-Hyogo" \
  "admin-bearer=$(pbpaste)"
```

## 3. revoke / ローテーション

- audit_log の `jti` で発行履歴を追跡可能
- 失効させたい場合は実装側で `revoked_jti` リスト（KV）を運用する（**本タスクの scope out**、将来拡張）
- 通常運用では 90 日 exp 自動失効に任せる

## エラー対応

| status | 対応 |
|--------|------|
| 400 / `ts_skew` | クライアント時刻同期 |
| 401 | HMAC 計算 / kid 登録状態を再確認 |
| 409 | nonce を新規生成して再試行 |
| 429 | `retry_after` 秒待機 |
| 500 | worker logs で `JWT_SIGNING_KEY` / KV binding を確認 |

## 完了条件

- 発行された JWT が 1Password に保管されている
- ターミナル履歴 / ログに JWT 本体が残っていない
- audit_log に発行記録が 1 件追加されている（`action=issue_service_token`）

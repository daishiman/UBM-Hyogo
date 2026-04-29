# Phase 11 smoke 期待値テンプレ（S-03 / S-07）

## 概要

UT-06 Phase 11 で `apps/api` の `/health/db` を叩く際の wire format 期待値テンプレ。本 PR で実装したハンドラと drift しない正本として保持する。

## 共通

```bash
# token は 1Password から取得（pipe する直前以外で平文化しない）
TOK=$(op read "op://UBM-Hyogo/cloudflare-api/HEALTH_DB_TOKEN")
API_BASE_STAGING=https://ubm-hyogo-api-staging.<account>.workers.dev
API_BASE_PROD=https://ubm-hyogo-api.<account>.workers.dev
```

## S-03: staging で `/health/db` 200 を返すこと（成功 wire format 確認）

### 実行

```bash
curl -sS -H "X-Health-Token: $TOK" \
  -o /tmp/s03.json -w "%{http_code}\n%{header_json}" \
  "${API_BASE_STAGING}/health/db"
```

### 期待値

```
200
```

`/tmp/s03.json`:

```json
{ "ok": true, "db": "ok", "check": "SELECT 1" }
```

レスポンスヘッダ:

- `Content-Type: application/json; charset=UTF-8`

### 失敗時の切り分け

| 観測 | 切り分け |
| --- | --- |
| `404` | route 未登録 / deploy 反映漏れ → `bash scripts/cf.sh deployments list` |
| `401` | token mismatch → 1Password 値と secret 値の同期確認 |
| `503` + `error: "HEALTH_DB_TOKEN unconfigured"` | secret 投入漏れ → operator-runbook §2 |
| `503` + 別 error | D1 障害 → `bash scripts/cf.sh tail --env staging` |

## S-07: staging fault injection で 503 + Retry-After を返すこと（失敗 wire format 確認）

### 実行（fault injection 戦略）

実 D1 を本物のまま叩く環境で 503 を再現するのは困難なため、以下のいずれかを採用:

1. 一時的に `HEALTH_DB_TOKEN` を空文字に上書きして fail-closed 503 を再現:

```bash
echo "" | bash scripts/cf.sh secret put HEALTH_DB_TOKEN --config apps/api/wrangler.toml --env staging
curl -sS -H "X-Health-Token: anything" -i "${API_BASE_STAGING}/health/db"
# 観測後、必ず正規 token に戻す:
op read "op://UBM-Hyogo/cloudflare-api/HEALTH_DB_TOKEN" | \
  bash scripts/cf.sh secret put HEALTH_DB_TOKEN --config apps/api/wrangler.toml --env staging
```

2. もしくは Vitest 単体テスト（`apps/api/src/health-db.test.ts`）の T4 結果を S-07 の代替エビデンスとして採用。

### 期待値

```
HTTP/1.1 503 Service Unavailable
Retry-After: 30
Content-Type: application/json; charset=UTF-8

{"ok":false,"db":"error","error":"HEALTH_DB_TOKEN unconfigured"}
```

または D1 真異常時:

```
{"ok":false,"db":"error","error":"<Error.name>"}
```

### 注意

- token の一時 wipe は **staging のみ** で実施。production では実施しない（外部監視が暴走するため）。
- 検証完了後 1Password 正規値を **必ず** 復元。

## S-11 / S-15: production smoke

S-03 / S-07 の手順を `${API_BASE_PROD}` に対して再実行。production では fault injection を実施しないため、S-15 は単体テスト T4 結果を流用。

## 不変条件 #5 整合確認

- S-03 / S-07 とも `apps/web` URL ではなく `apps/api` URL（`ubm-hyogo-api-*.workers.dev`）を叩く
- D1 への直接アクセスは Workers 内に閉じる

# runbook: production-runtime-smoke 環境プロビジョニング

## 対象

GitHub Environment: `production-runtime-smoke`

> **production の smoke は read-only 限定**。write 系の検証は staging で行う。本 runbook での操作はすべて user-gated。

## 必須 secret（4 件）

| name | 用途 | 1Password 参照（例） |
|------|------|--------------------|
| `PROD_API_BASE` | production API のベース URL | `op://UBM-Hyogo/production-runtime-smoke/api-base` |
| `PROD_ADMIN_BEARER` | 90 日有効 admin JWT（read-only smoke の admin/audit 用） | `op://UBM-Hyogo/production-runtime-smoke/admin-bearer` |
| `PROD_MEMBER_ID` | smoke 用 member の固定 ID（production seed user） | `op://UBM-Hyogo/production-runtime-smoke/member-id` |
| `PROD_ME_BEARER` | 90 日有効 member JWT | `op://UBM-Hyogo/production-runtime-smoke/me-bearer` |

任意: `SLACK_WEBHOOK_INCIDENT`（失敗通知）

## 事前確認（user-gated）

- [ ] production D1 に migration が適用済み（`runbooks/d1-migration-apply.md` を実行済み）
- [ ] production D1 に seed user（admin / member 各 1）が投入済み（`runbooks/service-token-issuance.md` §1）
- [ ] `apps/api` に service-token endpoint がデプロイ済み
- [ ] Cloudflare Secret `SERVICE_TOKEN_SHARED_SECRET` / `JWT_SIGNING_KEY` / `SERVICE_TOKEN_REGISTERED_KIDS` / `SMOKE_ADMIN_USER_ID` / `SMOKE_MEMBER_USER_ID` が production worker に投入済み
- [ ] GitHub UI で `production-runtime-smoke` Environment が作成済み（保護ルール: required reviewer = user）

## 手順

### 1. service-token 発行

`runbooks/service-token-issuance.md` の手順で `production` 環境向けに admin / member の JWT を発行する。

### 2. 1Password 保管 → GitHub Environment 投入

```bash
bash scripts/smoke/provision-runtime-smoke-secrets.sh production --mode op
```

### 3. allowlist 確認

`scripts/ci/verify-env-secrets.allowlist` に以下行があることを確認:

```
production-runtime-smoke: PROD_API_BASE PROD_ADMIN_BEARER PROD_MEMBER_ID PROD_ME_BEARER
```

### 4. preflight 検証

```bash
bash scripts/ci/verify-env-secrets.sh production-runtime-smoke
```

### 5. smoke 実行

```bash
gh workflow run runtime-smoke-production.yml --ref main
```

確認: `gh run list --workflow=runtime-smoke-production.yml --limit 1` → success

## 失敗時の切り分け

| 症状 | 原因候補 | 対応 |
|------|---------|------|
| `missing secrets in environment 'production-runtime-smoke'` | secret 未投入 / typo | 手順 2 を再実行 |
| `401` from `/api/me` | bearer 失効 / sub mismatch | 手順 1 で再発行 |
| `500` from API | D1 schema mismatch | `runbooks/d1-migration-apply.md` を確認 |
| `429` from service-token endpoint | rate limit | 1 時間待つ、または kid を分ける |

## ローテーション周期

- JWT: 90 日（exp - 7 日で再発行推奨）
- `SERVICE_TOKEN_SHARED_SECRET`: 1 年毎 / インシデント発生時に即時
- `JWT_SIGNING_KEY`: 1 年毎（ローテ時は古い JWT が全て無効化されるため事前再発行が必要）

## 完了条件

- 4 件の secret が `production-runtime-smoke` Environment に投入
- `verify-env-secrets` PASS
- `runtime-smoke-production.yml` PASS
- read-only ルートのみが叩かれていることを smoke ログで確認

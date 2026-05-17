# runbook: staging-runtime-smoke 環境プロビジョニング

## 対象

GitHub Environment: `staging-runtime-smoke`

## 必須 secret（4 件）

| name | 用途 | 1Password 参照（例） |
|------|------|--------------------|
| `STAGING_API_BASE` | staging API のベース URL | `op://UBM-Hyogo/staging-runtime-smoke/api-base` |
| `STAGING_ADMIN_BEARER` | 90 日有効 admin JWT（service-token endpoint で発行） | `op://UBM-Hyogo/staging-runtime-smoke/admin-bearer` |
| `STAGING_MEMBER_ID` | smoke 用 member の固定 ID | `op://UBM-Hyogo/staging-runtime-smoke/member-id` |
| `STAGING_ME_BEARER` | 90 日有効 member JWT | `op://UBM-Hyogo/staging-runtime-smoke/me-bearer` |

任意: `SLACK_WEBHOOK_INCIDENT`（失敗通知）

> **値は本 runbook に直接書かない。1Password 参照のみ。**

## 手順（user-gated）

### 1. service-token endpoint 経由で bearer 発行

`runbooks/service-token-issuance.md` の手順で `staging` 環境向けに admin / member の JWT を発行する。発行結果（token / exp）はクリップボード or 1Password に直接保存する。**標準出力をログに残さない**。

### 2. 1Password に保管

```bash
# 例（user 操作）
op item edit "staging-runtime-smoke" --vault "UBM-Hyogo" \
  "admin-bearer=<発行された JWT>" \
  "me-bearer=<発行された JWT>"
```

### 3. GitHub Environment に投入（provision script 経由）

```bash
bash scripts/smoke/provision-runtime-smoke-secrets.sh staging --mode op
```

または直接 `gh secret set`:

```bash
bash scripts/smoke/provision-runtime-smoke-secrets.sh staging --mode gh
# 内部で次を順次実行:
#   gh secret set STAGING_API_BASE --env staging-runtime-smoke --body "$(op read op://...)"
#   gh secret set STAGING_ADMIN_BEARER --env staging-runtime-smoke --body "$(op read op://...)"
#   gh secret set STAGING_MEMBER_ID --env staging-runtime-smoke --body "$(op read op://...)"
#   gh secret set STAGING_ME_BEARER --env staging-runtime-smoke --body "$(op read op://...)"
```

### 4. preflight 検証

```bash
gh workflow run verify-env-secrets.yml --ref dev
# または
bash scripts/ci/verify-env-secrets.sh staging-runtime-smoke
```

期待: exit 0 / `all required secrets present`

### 5. smoke rerun

```bash
gh workflow run runtime-smoke-staging.yml --ref dev
```

成功確認: `gh run list --workflow=runtime-smoke-staging.yml --limit 1`

## ローテーション

90 日経過前に手順 1〜5 を再実行する。古い JWT は audit_log の `jti` で revoke 可（実装後）。

## 失敗時

`runbooks/runtime-smoke-env-provisioning-production.md` の §失敗時セクションを参照（共通）。

## 完了条件

- 4 件の secret が `staging-runtime-smoke` Environment に投入されている
- `verify-env-secrets` が PASS
- `runtime-smoke-staging.yml` が直近 run で PASS

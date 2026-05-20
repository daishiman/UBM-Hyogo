# Inventory before runtime mutation

Status: `local_readonly_pending`

本ファイルは template placeholder。inventory 取得は read-only であり、値・トークン断片を記録せず、name と timestamp のみ記録する。外部 mutation は発生しない。

## 取得コマンド

```bash
# 1. repository-level secrets (name のみ)
gh secret list --repo daishiman/UBM-Hyogo > outputs/phase-02/before-repo-secrets.md

# 2. production environment-level secrets
gh secret list --repo daishiman/UBM-Hyogo --env production > outputs/phase-02/before-prod-secrets.md

# 3. repository-level variables (name / created_at / updated_at のみ抽出)
gh api repos/daishiman/UBM-Hyogo/actions/variables \
  | jq '.variables[] | {name, created_at, updated_at}' \
  > outputs/phase-02/before-repo-vars.json

# 4. production environment-level variables
gh api repos/daishiman/UBM-Hyogo/environments/production/variables \
  | jq '.variables[] | {name, created_at, updated_at}' \
  > outputs/phase-02/before-prod-vars.json
```

## 期待 snapshot（2026-05-17 確認時点）

### repository-level secrets

| Name | 期待状態 |
| --- | --- |
| `GH_VERIFY_ENV_SECRETS_TOKEN` | 存在 |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | 存在 |
| `SLACK_WEBHOOK_INCIDENT` | 存在 |
| `CF_AUDIT_D1_TOKEN_PROD` | **不在** |
| `CF_AUDIT_TOKEN_PROD` | **不在** |
| `CF_AUDIT_WORKERS_AI_TOKEN` | **不在** |
| `EMAIL_WEBHOOK_URL` | **不在** |

### production environment-level secrets

| Name | 期待状態 |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | 存在（deploy 系、対象外） |
| monitor 専用 secret（`CF_AUDIT_*` / `EMAIL_*`） | **すべて不在** ← cleanup no-op 根拠 |

### repository-level variables

| Name | 期待状態 |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | 存在 |
| `FORM_ID` | 存在 |
| `SHEET_ID` | 存在 |
| `CF_AUDIT_CLASSIFIER` / `ML_MODEL_PATH` / `CF_AUDIT_IF_MODEL` / `CF_AUDIT_XGB_MODEL` / `CF_AUDIT_WORKERS_AI_URL` / `CF_AUDIT_CLASSIFIER_VERSION` / `EMAIL_FROM` / `EMAIL_TO` | **すべて不在** |

### production environment-level variables

| Name | 期待状態 |
| --- | --- |
| `CF_AUDIT_CLASSIFIER` | 存在（`ml`） |

## 不変条件

1. secret value を**一切記録しない**（trace / log / commit から完全排除）
2. variable value は非機密だが、`gh api` レスポンスに secret 名が混入することはないか念のため Phase 11 で leakage grep
3. snapshot 取得タイムスタンプを UTC で記録（`date -u +%Y-%m-%dT%H:%M:%SZ`）
4. 本 snapshot 取得後、(b) repo-level 投入操作開始までの間に他の workflow による secret 投入が**ないこと**を確認する（race condition 回避）

## cleanup no-op 根拠の確定

production env 側に monitor 専用 secret（`CF_AUDIT_*` / `EMAIL_WEBHOOK_URL`）が**既に不在**であることが本 snapshot で記録されれば、Issue #772 原典の cleanup スコープ（production env 側削除）は no-op で完了する。Phase 13 の post-cleanup-secret-inventory.md は本 before snapshot との diff = 0 を示せばよい。

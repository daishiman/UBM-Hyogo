# Phase 2: 設計

## 設計判断

### D1. CF token は GitHub Environment Secret 直接注入

| 案 | 採否 | 理由 |
|---|---|---|
| A. workflow を `secrets.CLOUDFLARE_API_TOKEN` 参照に統一 | ✅ 採用 | 既存 Environment 登録と一致。改修箇所は YAML 2 行のみ。op 経路は CI で skip される既存分岐 (`cf.sh:21-23`) に乗る |
| B. Environment secret を `CF_TOKEN_WORKERS_STAGING` 等にリネーム | ✗ | 影響箇所多数（ユーザー操作必須・secret 削除は不可逆）。価値なし |
| C. `op` を CI runner にインストール | ✗ | ユーザー方針「CI では op 不使用」に反する |

### D2. runtime-smoke の readiness gate 設計

| 案 | 採否 | 理由 |
|---|---|---|
| A. 既存 step 内 implicit fail を維持 | ✗ | エラー位置が shell 内部で運用上わかりにくい |
| B. workflow に明示的 pre-check step を追加 | ✅ 採用 | 失敗理由を `::error::` で表に出し、必要 secret 名を runner ログに残す |
| C. workflow_call 側で `if:` skip | ✗ | smoke が静かに skip され「PASS のように見える」誤検出リスクあり |

### D3. cf.sh のロジック改変

非対象（CONST）。`cf.sh:21-23` の既存 `CF_SH_SKIP_WITH_ENV` 分岐がそのまま使えるため、CI 側で env を渡すだけで成立する。

## 変更対象ファイル一覧

| パス | 種別 | 変更概要 |
|---|---|---|
| `.github/workflows/web-cd.yml` | 編集 | line 22 `CF_TOKEN_WORKERS_STAGING` → `CLOUDFLARE_API_TOKEN`、line 56 `CF_TOKEN_WORKERS_PRODUCTION` → `CLOUDFLARE_API_TOKEN`。あわせて `Verify CF token presence` step を追加し空時 early fail |
| `.github/workflows/runtime-smoke-staging.yml` | 編集 | `mask staging credentials` の前に readiness pre-check step を追加 |
| `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` | 新規 | `staging-runtime-smoke` env への secret 投入手順 runbook（実値は記載しない） |
| `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-01-*` | 新規 | task-01 仕様書 |
| `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-02-*` | 新規 | task-02 仕様書 |

## API / interface 定義（workflow contract）

### web-cd.yml deploy-{staging,production} env contract

```yaml
env:
  CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}   # Environment scoped
  CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}    # Repo variable
```

事前 step (新設):

```yaml
- name: Verify CF token is present
  run: |
    if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
      echo "::error::CLOUDFLARE_API_TOKEN is empty. Confirm GitHub Environment '${{ job.environment }}' has CLOUDFLARE_API_TOKEN registered."
      exit 1
    fi
```

### runtime-smoke-staging.yml readiness pre-check contract

```yaml
- name: verify required staging secrets
  run: |
    missing=()
    [ -z "${STAGING_API_BASE:-}" ] && missing+=("STAGING_API_BASE")
    [ -z "${STAGING_ADMIN_BEARER:-}" ] && missing+=("STAGING_ADMIN_BEARER")
    [ -z "${STAGING_MEMBER_ID:-}" ] && missing+=("STAGING_MEMBER_ID")
    [ -z "${STAGING_ME_BEARER:-}" ] && missing+=("STAGING_ME_BEARER")
    if [ "${#missing[@]}" -gt 0 ]; then
      echo "::error::missing secrets in environment 'staging-runtime-smoke': ${missing[*]}"
      echo "::error::register them via GitHub UI or 'gh secret set <NAME> --env staging-runtime-smoke'"
      exit 1
    fi
```

## 設計が満たす不変条件チェック

| 不変条件 | 満たし方 |
|---|---|
| CI で op 不使用 | `CLOUDFLARE_API_TOKEN` を env 注入することで `cf.sh:21-23` の skip 分岐に到達 |
| ローカル op 経路維持 | `cf.sh` 自体は無変更 |
| readiness 不足を黙殺しない | pre-check step が `::error::` で明示 fail |
| secret 値の docs 残留禁止 | runbook は名前と取得元（CF dashboard / Auth.js admin）の指示のみ |

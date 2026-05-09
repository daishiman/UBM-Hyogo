# GitHub Environment `staging-runtime-smoke` セットアップ runbook

`runtime-smoke-staging` workflow が Environment-scoped secret を読むための GitHub Environment 配置手順。**本ファイルは仕様書サイクル時点では実 API を叩かない**。実 mutation はユーザー承認後にのみ実施。

## 前提

- 1Password に以下の vault item が存在する（実値の正本）:
  - `STAGING_API_BASE` (Field: `value`)
  - `STAGING_ADMIN_BEARER` (Field: `value`)
  - `STAGING_MEMBER_ID` (Field: `value`)
  - `STAGING_ME_BEARER` (Field: `value`)
  - `SLACK_WEBHOOK_INCIDENT` (Field: `value`)
- repository 管理者権限 (`gh` CLI 認証済み)

## 手順

### 1. Environment 作成

GitHub UI: Settings → Environments → New environment → name: `staging-runtime-smoke`

または `gh` で作成（idempotent）:

```bash
gh api -X PUT repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke \
  -f wait_timer=0 \
  --silent
```

### 2. Environment-scoped secret 配置

`scripts/cf.sh` 同等の方針で **op 経由で実値を取得し、ファイル / shell history に残さず配置** する:

```bash
# 例: STAGING_ADMIN_BEARER を op から GitHub Environment secret に転送
op read 'op://Staging/STAGING_ADMIN_BEARER/value' |
  gh secret set STAGING_ADMIN_BEARER \
    --env staging-runtime-smoke \
    --repo daishiman/UBM-Hyogo \
    --body-file -

# 同様に以下 5 件
for name in STAGING_API_BASE STAGING_MEMBER_ID STAGING_ME_BEARER SLACK_WEBHOOK_INCIDENT; do
  op read "op://Staging/$name/value" |
    gh secret set "$name" \
      --env staging-runtime-smoke \
      --repo daishiman/UBM-Hyogo \
      --body-file -
done
```

### 3. Dispatch token 不要の確認

Issue #571 の現行実装は `backend-ci.yml` から reusable workflow (`workflow_call`) で `runtime-smoke-staging.yml` を呼ぶ。`repository_dispatch` を使わないため、`RUNTIME_SMOKE_DISPATCH_TOKEN` は作成しない。

### 4. 検証

```bash
# Environment secrets 一覧
gh api repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke/secrets \
  --jq '.secrets[].name'
# 期待: STAGING_API_BASE STAGING_ADMIN_BEARER STAGING_MEMBER_ID STAGING_ME_BEARER SLACK_WEBHOOK_INCIDENT

# 手動 trigger で smoke を起動
gh workflow run runtime-smoke-staging.yml --repo daishiman/UBM-Hyogo
```

### 5. ローテーション SOP

90 日ごと、または incident 時:

1. 1Password 側で値を rotate
2. 上記手順 §2 を再実行（gh secret set は idempotent に上書き）
3. `gh run watch` で次回 smoke が PASS することを確認

## 禁止事項

- `gh secret set --body "<実値>"` または `--body "$(op read ...)"` で secret をプロセス引数に載せる（必ず `op read ... | gh secret set --body-file -`）
- repository-scoped secret に staging API credential を配置（Environment scope 必須）
- `wrangler login` の OAuth キャッシュに依存（CLAUDE.md 既定通り `op` 一本化）

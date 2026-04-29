# Phase 13 apply-runbook — GitHub Secrets / Variables 配置（NOT EXECUTED）

> user の明示承認、PR マージ、上流 3 件（UT-05 / UT-28 / 01b）完了確認が揃うまで実行しない。

## STEP 0: 前提確認

```bash
gh auth status
gh pr list --search "UT-05" --state merged
bash scripts/cf.sh pages project list
op item get "Cloudflare" --vault UBM-Hyogo > /dev/null

# B-07: Discord 通知の旧条件が残る場合は実 PUT NO-GO。
# UT-05 側で env 受け + シェル空文字判定へ修正済みであることを確認する。
! rg -n "if:.*secrets\\.DISCORD_WEBHOOK_URL.*!= *''" .github/workflows/backend-ci.yml .github/workflows/web-cd.yml
```

## STEP 1: GitHub Environments 作成

```bash
gh api repos/{owner}/{repo}/environments/staging -X PUT
gh api repos/{owner}/{repo}/environments/production -X PUT
```

## STEP 2: Secret 配置

```bash
export TMP_CF_TOKEN_STG="$(op read 'op://UBM-Hyogo/Cloudflare/api_token_staging')"
export TMP_CF_TOKEN_PRD="$(op read 'op://UBM-Hyogo/Cloudflare/api_token_production')"
export TMP_CF_ACCOUNT_ID="$(op read 'op://UBM-Hyogo/Cloudflare/account_id')"
export TMP_DISCORD_WEBHOOK_URL="$(op read 'op://UBM-Hyogo/Discord/webhook_url')"

gh secret set CLOUDFLARE_API_TOKEN --env staging --body "$TMP_CF_TOKEN_STG"
gh secret set CLOUDFLARE_API_TOKEN --env production --body "$TMP_CF_TOKEN_PRD"
gh secret set CLOUDFLARE_ACCOUNT_ID --body "$TMP_CF_ACCOUNT_ID"
gh secret set DISCORD_WEBHOOK_URL --body "$TMP_DISCORD_WEBHOOK_URL"

unset TMP_CF_TOKEN_STG TMP_CF_TOKEN_PRD TMP_CF_ACCOUNT_ID TMP_DISCORD_WEBHOOK_URL
```

## STEP 3: Variable 配置

```bash
export TMP_CF_PAGES_PROJECT="$(op read 'op://UBM-Hyogo/Cloudflare/pages_project_name')"
gh variable set CLOUDFLARE_PAGES_PROJECT --body "$TMP_CF_PAGES_PROJECT"
unset TMP_CF_PAGES_PROJECT
```

## STEP 4: 配置確認

```bash
gh secret list
gh secret list --env staging
gh secret list --env production
gh variable list
```

## ロールバック

```bash
gh secret delete CLOUDFLARE_API_TOKEN --env staging
gh secret delete CLOUDFLARE_API_TOKEN --env production
gh secret delete CLOUDFLARE_ACCOUNT_ID
gh secret delete DISCORD_WEBHOOK_URL
gh variable delete CLOUDFLARE_PAGES_PROJECT
```

## 禁止事項

- secret / token 値を payload、runbook、ログ、Phase outputs に転記しない。
- shell history に値が残る `--body "実値"` 形式を使わない。
- user 承認なしに `gh secret set` / `gh variable set` / `gh api .../environments` を実行しない。

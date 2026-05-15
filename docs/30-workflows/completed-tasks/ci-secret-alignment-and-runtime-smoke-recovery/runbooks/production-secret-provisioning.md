# `web-cd / deploy-production` Cloudflare API Token Provisioning

## 目的

GitHub Environment `production` に `web-cd / deploy-production` が Cloudflare Workers へデプロイするための `CLOUDFLARE_API_TOKEN` を投入する。**実値・token preview・hash はこのドキュメントに書かない**。取得元は 1Password 参照のみを示す。

`CLOUDFLARE_ACCOUNT_ID` は GitHub Variables 管理であり、GitHub Environment Secret ではない。この runbook では `CLOUDFLARE_API_TOKEN` の Environment Secret 投入だけを扱う。

## 必要 secret 一覧

| secret 名 | GitHub Environment | 取得元 |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | `production` | `op://UBM-Hyogo/Cloudflare API Token (production)/credential` |

補足: `CLOUDFLARE_ACCOUNT_ID` は `vars.CLOUDFLARE_ACCOUNT_ID` として参照される GitHub Variables 管理値。Environment Secret に登録しない。

## 投入手順

ユーザーが 1Password CLI と GitHub CLI にログインしたうえで、次を実行する。値を stdout・ファイル・shell history に残さないため、1Password から `gh secret set` の stdin へ直接渡す。

```bash
op read 'op://UBM-Hyogo/Cloudflare API Token (production)/credential' | \
  gh secret set CLOUDFLARE_API_TOKEN --env production
```

実値を heredoc、コマンド引数、メモ、AI チャットに貼り付けない。

## 投入確認

secret 名だけを確認する。実値・preview・hash は確認しない。

```bash
gh api repos/daishiman/UBM-Hyogo/environments/production/secrets \
  --jq '.secrets[].name' | sort
# 期待出力に含まれること:
# CLOUDFLARE_API_TOKEN
```

`CLOUDFLARE_ACCOUNT_ID` は Variables 側で確認する。

```bash
gh variable list --env production | grep '^CLOUDFLARE_ACCOUNT_ID'
```

## 動作確認

`main` push で `web-cd / deploy-production` が実行される。手動確認する場合は対象 run の `Verify CF token is present` と `Deploy to Cloudflare Workers (production)` が PASS していることを確認する。

```bash
gh run list --workflow web-cd.yml --branch main --limit 5
```

`Verify CF token is present` が `CLOUDFLARE_API_TOKEN is empty` で失敗する場合は、`production` Environment Secret への投入漏れとして扱う。

## ローテーション運用

Cloudflare 側で production 用 API Token を再発行したら、1Password item `UBM-Hyogo / Cloudflare API Token (production)` の `credential` を更新し、同じ `op read | gh secret set` 手順で GitHub Environment Secret を上書きする。

ローテーション後は `main` 上の `web-cd / deploy-production` を確認し、旧 token の失効による deploy 失敗がないことを確認する。

## 禁止事項

1. `CLOUDFLARE_API_TOKEN` の実値・token preview・hash をドキュメント、Issue、PR、commit message、Slack、AI チャットに書かない。
2. `op read 'op://UBM-Hyogo/Cloudflare API Token (production)/credential'` の実行を AI エージェントに代行させない。
3. `gh secret set CLOUDFLARE_API_TOKEN --env production --body '<value>'` のように値が shell history や process list に残る形で投入しない。
4. `CLOUDFLARE_ACCOUNT_ID` を Environment Secret として登録しない。GitHub Variables 管理値として扱う。
5. `staging-runtime-smoke` の secret と混同しない。`web-cd / deploy-production` は GitHub Environment `production` の `CLOUDFLARE_API_TOKEN` を使い、`staging-runtime-smoke` の `STAGING_*` secret は参照しない。

# Implementation Guide

## Part 1: 中学生レベル

CI が落ちていた理由は 2 つです。Web は古い Pages 方式で大きすぎる `.next` をアップロードしていました。runtime smoke は必要な secret がなく、最初の失敗のあと Slack 通知でも `summary.json` がなくて別の失敗を出していました。

今回の修正では、Web を正本どおり Cloudflare Workers へデプロイする形に戻し、staging smoke の secret は値を表示しない専用 script で入れられるようにしました。実際の secret 投入と staging 実行は、外部サービスの状態を変えるのでユーザー承認後だけ行います。

## Part 2: 技術者向け

- `web-cd.yml`: `cloudflare/wrangler-action@v3` と `pages deploy .next` を撤去し、`jdx/mise-action@v2` + `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` + `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging|production` に統一。`scripts/cf.sh` 互換のため env 名は `CLOUDFLARE_API_TOKEN` だが、値は job ごとの `CF_TOKEN_WORKERS_STAGING` / `CF_TOKEN_WORKERS_PRODUCTION` から渡す。
- `runtime-smoke-staging.yml`: Slack post step を `${{ failure() && hashFiles('ci-evidence/summary.json') != '' }}` に制限し、primary failure を二重化しない。
- `scripts/smoke/provision-staging-secrets.sh`: `op read "$ref" | gh secret set "$name" --env staging-runtime-smoke --repo daishiman/UBM-Hyogo --body -` を固定。inventory は name-only で検証。
- Security: secret values, hashes, fragments, webhook URLs, decoded cookies are not logged or written to evidence.
- Runtime boundary: deployment and secret mutation are Phase 13 operations requiring explicit user approval.

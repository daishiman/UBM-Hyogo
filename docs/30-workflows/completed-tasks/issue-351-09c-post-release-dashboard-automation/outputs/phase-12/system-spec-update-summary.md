# Phase 12 System Spec Update Summary

state: implemented-local
workflow_id: issue-351-09c-post-release-dashboard-automation

## Step 1-A: deployment-gha.md

`.claude/skills/aiworkflow-requirements/references/deployment-gha.md` に Issue #351 post-release dashboard automation を同期した。

反映内容:

- workflow file: `.github/workflows/post-release-dashboard.yml`
- 起動: `schedule: '0 0 * * *'` UTC + `workflow_dispatch`
- secret: `CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY`
- account variable: `vars.CLOUDFLARE_ACCOUNT_ID`
- artifact path: `outputs/post-release-dashboard/<UTC-yyyy-mm-dd>/dashboard.{json,md}`
- retention: 90 days
- metrics: `workers_requests` / `workers_errors` / `d1_reads` / `d1_writes` / `cron_status`
- redaction gate: `scripts/post-release-dashboard/lib/redaction-check.sh`

## Step 1-B: deployment-cloudflare-opennext-workers.md

`.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md` に analytics read-only token 分離を同期した。

反映内容:

- production deploy 用 `CLOUDFLARE_API_TOKEN` と analytics 用 `CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY` を分離
- analytics 用 token scope は `Account.Account Analytics:Read` + `Workers Scripts:Read` + `D1:Read`
- `scripts/cf.sh api-post` は `/client/v4/graphql` のみ許可し、GraphQL Analytics query 専用境界に固定

## Step 1-C: artifact inventory / active workflow

- `.claude/skills/aiworkflow-requirements/references/workflow-issue-351-09c-post-release-dashboard-automation-artifact-inventory.md` を追加
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` に current workflow と実装対象を追加
- `.claude/skills/aiworkflow-requirements/changelog/20260505-issue351-post-release-dashboard.md` を追加

## Step 2: domain sync

09c 親 workflow の手動 metrics 運用を置き換える実装として本 workflow を登録した。親 workflow 自体のファイル編集は今回行っていないが、artifact inventory と quick-reference から Issue #351 の current workflow に到達できる。

## 判定

正本同期は PASS。runtime schedule conclusion はユーザー承認後の GitHub Actions 実行後に Phase 11 evidence として追記する。

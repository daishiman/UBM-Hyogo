# Implementation Guide: 09a-A Staging Deploy Smoke Execution

## Part 1: 中学生レベル

本番に出す前に、練習用の場所で一度通して確認するための手順です。学校の文化祭で、当日の朝に音響、受付、案内板、出し物の順番を全部確認するのに近いです。お客さんが来る前に、入り口が開くか、係の人だけが入れる部屋に他の人が入れないか、記録係の紙が正しく集まるかを確かめます。

このタスクでは、UBM 兵庫支部会の練習用サーバーで公開ページ、ログイン、会員ページ、管理画面、Forms 連携、D1 データベースの形を確認します。実際のサーバーやデータを触る操作は失敗すると影響が残るため、G1 から G4 の承認をもらってから進めます。

| 専門用語 | 日常語での言い換え |
| --- | --- |
| staging | 本番前の練習場所 |
| smoke test | 壊れていないかの最低限確認 |
| deploy | 練習場所へ新しい版を置くこと |
| D1 migration | データの入れ物を新しい形にそろえる作業 |
| evidence | あとで確認できる証拠メモ |
| approval gate | 進む前に人が許可する止まり場所 |

## Part 2: 技術者レベル

### Runtime Contract

```ts
type SmokeResult = "PASS" | "FAIL" | "BLOCKED" | "SOFT_FAIL";

interface StagingSmokeEvidence {
  id: string;
  path: string;
  runtimePath:
    | "cloudflare-api-worker"
    | "cloudflare-web-worker"
    | "public-web"
    | "auth-profile"
    | "admin-ui"
    | "forms-sync"
    | "d1-schema"
    | "wrangler-tail";
  result: SmokeResult;
  redacted: boolean;
  acquiredAtUtc: string;
}
```

### CLI / API Signatures

| 操作 | コマンドまたは入口 | Evidence |
| --- | --- | --- |
| API deploy | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` | `outputs/phase-11/evidence/deploy/deploy-api-staging.log` |
| Web deploy | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` | `outputs/phase-11/evidence/deploy/deploy-web-staging.log` |
| Public curl | `curl "$STAGING_WEB_URL/members?...` | `outputs/phase-11/evidence/curl/curl-public-members-*.log` |
| Playwright visual | `pnpm --filter @ubm-hyogo/web exec playwright test --config=playwright.staging.config.ts --reporter=html,list` | `outputs/phase-11/evidence/playwright/` |
| UI screenshots | Playwright screenshot capture against staging Workers URL | `outputs/phase-11/evidence/screenshots/{public-members,login,me,admin}-staging.png` |
| Forms schema sync | admin sync endpoint via operator auth | `outputs/phase-11/evidence/forms/forms-schema-sync.log` |
| Forms responses sync | admin sync endpoint via operator auth | `outputs/phase-11/evidence/forms/forms-responses-sync.log` |
| D1 migration list | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging` | `outputs/phase-11/evidence/d1/d1-migrations-staging.log` |
| D1 schema parity | `bash scripts/cf.sh d1 execute ... --command "PRAGMA table_info(...)"` | `outputs/phase-11/evidence/d1/d1-schema-parity.json` |
| Wrangler tail | `bash scripts/cf.sh tail ubm-hyogo-api-staging --env staging --format pretty` with redaction | `outputs/phase-11/evidence/wrangler-tail/api-30min.log` |

### Error Handling

| Case | Handling |
| --- | --- |
| Cloudflare auth failure | `BLOCKED` として保存し、secret 値は出力しない |
| D1 pending migration | G2 approval 前は apply しない。pending 理由を evidence 化する |
| Visual smoke failure | screenshot / trace / route / expected selector を保存し、09c blocker を残す |
| Forms quota / API failure | retry 可否と quota 状態を記録し、未解消なら 09c blocker に反映する |
| Wrangler tail unavailable | token scope または quota の取得不能理由を redacted log に残す |

### Constants

| Name | Value |
| --- | --- |
| Evidence root | `docs/30-workflows/09a-A-staging-deploy-smoke-execution/outputs/phase-11/evidence/` |
| Approval gates | G1 deploy, G2 D1 apply, G3 Forms sync, G4 blocker update commit |
| Runtime boundary | Phase 11 actual evidence is pending user approval |
| Completion boundary | Phase 12 spec completeness PASS does not mean runtime PASS |
| Screenshot boundary | Four PNG screenshots are required only when Phase 11 runtime execution is approved and run |

# Implementation Guide

## Part 1: 中学生レベル

いまの deploy は、学校の部室にずっと使える合鍵を置いておくような状態です。合鍵を小さな箱に入れていても、誰かが間違って持ち出すと、あとで鍵を取り替えるまで危険が続きます。

このタスクでは、ずっと使える合鍵を GitHub に置くのをやめます。かわりに、GitHub Actions が「自分はこの部活の当番です」とその場で証明し、短い時間だけ使える鍵をもらいます。鍵は job が終われば使えなくなるので、もしログや設定を間違えても危険な時間を短くできます。

| 用語 | 日常語での説明 |
| --- | --- |
| OIDC | その場で身分を証明する仕組み |
| 短命 credential | 短い時間だけ使える鍵 |
| 長命 Token | ずっと使える合鍵 |
| trust policy | 誰に鍵を渡してよいかを書いた受付ルール |
| rollback | 困った時だけ前の方法に戻す手順 |

## Part 2: 技術者レベル

### Contract

```ts
type CfAuthMode = "legacy" | "oidc-short-lived";

interface OidcCfCredentialEvidence {
  provider: "aws-sts";
  lifetimeSeconds: number;
  scopes: readonly [
    "Workers Scripts:Edit",
    "D1:Edit",
    "Cloudflare Pages:Edit",
    "Account Settings:Read"
  ];
  githubSub: string;
  environment: "staging" | "production";
}
```

### Runtime Path

GitHub Actions deploy jobs in `web-cd.yml` and `backend-ci.yml` get `permissions.id-token: write` only on deploy jobs. `d1-migration-verify.yml` is also in the inventory because it currently references `CLOUDFLARE_API_TOKEN_STAGING`. The job exchanges GitHub OIDC for AWS STS credentials, resolves a Cloudflare deploy credential for the job, and invokes `scripts/cf.sh` with `CF_AUTH_MODE=oidc-short-lived`.

If Cloudflare cannot issue a true per-job short-lived API token, the short-lived boundary is the AWS STS session (`<= 3600s`) plus job-scoped retrieval. In that case the documentation must not claim that the Cloudflare API Token object itself expires in one hour.

### Usage Example

```yaml
permissions:
  id-token: write
  contents: read

steps:
  - uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: arn:aws:iam::<ACCOUNT_ID>:role/github-actions-cloudflare-deploy
      aws-region: ap-northeast-1
      role-duration-seconds: 3600
  - run: bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
    env:
      CF_AUTH_MODE: oidc-short-lived
```

### Parameters

| Name | Value / Rule |
| --- | --- |
| `CF_AUTH_MODE` | `legacy` for local / rollback, `oidc-short-lived` for approved CI cutover |
| `role-duration-seconds` | max `3600` |
| workflow inventory | `.github/workflows/web-cd.yml`, `.github/workflows/backend-ci.yml`, `.github/workflows/d1-migration-verify.yml` |
| current secrets | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_API_TOKEN_STAGING` until runtime cutover |
| required scopes | `Workers Scripts:Edit`, `D1:Edit`, `Cloudflare Pages:Edit`, `Account Settings:Read` |

### Error Handling

| Error | Handling |
| --- | --- |
| OIDC subject mismatch | fail closed; do not broaden trust policy |
| lifetime > 3600 seconds | block cutover |
| scope drift | block cutover and reissue minimum-scope token |
| deploy failure after cutover | use 24h emergency rollback path only with approval |
| secret in logs | revoke exposed token and redact evidence |
| `CLOUDFLARE_API_TOKEN_STAGING` remains in D1 verify workflow | block G2 until impact check or migration path is included |

# Implementation Guide

## Part 1: 中学生レベル

家の鍵が 1 本だけだと、その鍵をなくした時に家の全部の部屋に入られる危険があります。玄関、倉庫、作業部屋で鍵を分けておけば、1 本なくしても被害はその部屋だけにできます。

今回の変更も同じです。Cloudflare を動かすための大きな鍵を 1 本で使うのではなく、D1 用、Workers 用、Pages 用に分けます。さらに、練習用の環境と本番用の環境でも分けます。合計 6 本の鍵にすることで、もし 1 本が漏れても、できることを狭くできます。

| 専門用語 | 日常語での言い換え |
| --- | --- |
| Token | 作業できる範囲が決まった鍵 |
| scope | 鍵で開けられる場所 |
| D1 | データをしまう箱 |
| Workers | サーバーで動く作業係 |
| Pages | Web ページを公開する場所 |
| staging | 本番前の練習場所 |
| production | 本番の場所 |

## Part 2: 技術者レベル

### Token Matrix

| Secret | Scope | Consumer |
| --- | --- | --- |
| `CF_TOKEN_D1_STAGING` | `D1:Edit`, `Account Settings:Read` | `.github/workflows/backend-ci.yml` staging migration step |
| `CF_TOKEN_D1_PRODUCTION` | `D1:Edit`, `Account Settings:Read` | `.github/workflows/backend-ci.yml` production migration step |
| `CF_TOKEN_WORKERS_STAGING` | `Workers Scripts:Edit`, `Account Settings:Read` | `.github/workflows/backend-ci.yml` staging Workers deploy step |
| `CF_TOKEN_WORKERS_PRODUCTION` | `Workers Scripts:Edit`, `Account Settings:Read` | `.github/workflows/backend-ci.yml` production Workers deploy step |
| `CF_TOKEN_PAGES_STAGING` | `Cloudflare Pages:Edit`, `Account Settings:Read` | `.github/workflows/web-cd.yml` staging Pages deploy step |
| `CF_TOKEN_PAGES_PRODUCTION` | `Cloudflare Pages:Edit`, `Account Settings:Read` | `.github/workflows/web-cd.yml` production Pages deploy step |

### Runtime Path x Evidence

| Path | Evidence | Status |
| --- | --- | --- |
| Workflow static contract | `rg "CF_TOKEN_" .github/workflows/backend-ci.yml .github/workflows/web-cd.yml` | local verified |
| `scripts/cf.sh` pre-injected token path | `bash scripts/__tests__/cf-token-arg.test.sh` | local verified |
| Token issuance | `outputs/phase-11/token-issuance-evidence.json` | runtime pending user operation |
| GitHub Secrets placement | `outputs/phase-11/github-secret-list.json` | runtime pending user operation |
| 7 day staging green window | `outputs/phase-11/staging-7day-green-evidence.json` | runtime pending after merge |
| 24h old token retirement | `outputs/phase-11/old-token-retirement-evidence.json` | runtime pending after production success |

### Error Handling

| Failure | Likely cause | Recovery |
| --- | --- | --- |
| D1 migration returns 403 | D1 token missing `D1:Edit` | Reissue only `CF_TOKEN_D1_<ENV>` |
| Workers deploy returns 403 | Workers token missing `Workers Scripts:Edit` | Reissue only `CF_TOKEN_WORKERS_<ENV>` |
| Pages deploy returns 403 | Pages token missing `Cloudflare Pages:Edit` | Reissue only `CF_TOKEN_PAGES_<ENV>` |
| `scripts/cf.sh whoami` prompts for 1Password in CI | pre-injected env path failed | Confirm `CLOUDFLARE_API_TOKEN` is set before invoking script |

### Constants

| Name | Value |
| --- | --- |
| Secret naming | `CF_TOKEN_<D1|WORKERS|PAGES>_<STAGING|PRODUCTION>` |
| Old secret | `CLOUDFLARE_API_TOKEN` deprecated after 24h parallel window |
| Issue reference | `Refs #406` because Issue #406 is already CLOSED |

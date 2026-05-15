# Implementation Guide

## Part 1: 中学生向け説明

GitHub Actions が Cloudflare へデプロイするとき、`staging` と `production` という 2 つの環境ごとに別々の鍵を使う。たとえば学校で「練習用の教室」と「本番発表のホール」に別々の鍵があるのと同じで、練習用の鍵で本番ホールを開けないように分けておく。

この作業では、鍵そのものは書かない。鍵の実物を書くと、誰でも Cloudflare を操作できる危険があるからである。代わりに、「1Password のどこに鍵があるか」と「GitHub のどの金庫へ入れるか」だけを書く。

今回の見直しで、古い手順に「`gh secret set --body -` を使う」と読める説明が残っていた。現在の GitHub CLI は、`--body` を書かなければ標準入力から値を読む。そこで、手順書と helper script を同じ形にそろえた。

| 専門用語 | 中学生向け説明 | このタスクでの意味 |
| --- | --- | --- |
| GitHub Environment | 名前付きの金庫 | `staging` / `production` / `staging-runtime-smoke` |
| Secret | 見せてはいけない鍵 | `CLOUDFLARE_API_TOKEN` |
| Variable | 見せてもよい設定メモ | `CLOUDFLARE_ACCOUNT_ID` |
| 1Password | 鍵の保管庫 | `op://...` 参照だけを文書に書く |
| stdin | 手渡しの通り道 | `op read` の出力を `gh secret set` に直接渡す |
| user-gated | 人間の許可が必要 | secret 登録、commit、push、PR は実行しない |

## Part 2: 技術者向け説明

### Contract

`web-cd.yml` は `dev` push で `deploy-staging`、`main` push で `deploy-production` を実行し、各 GitHub Environment の `secrets.CLOUDFLARE_API_TOKEN` と `vars.CLOUDFLARE_ACCOUNT_ID` を参照する。

| Field | Type | Owner | Notes |
| --- | --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | GitHub Environment Secret | `staging` / `production` | web-cd deploy token。値・hash・preview は記録禁止 |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub Variable | environment or repository variable layer | Secret に投入しない |
| `STAGING_*` smoke credentials | GitHub Environment Secret | `staging-runtime-smoke` | runtime smoke 専用。web-cd deploy token と混同しない |

### Command Signature

```bash
op read 'op://UBM-Hyogo/Cloudflare API Token (<env>)/credential' | \
  gh secret set CLOUDFLARE_API_TOKEN --env <env>
```

`gh secret set <name> --env <env>` reads the secret value from stdin when `--body` is omitted. Do not use `--body '<value>'`; it exposes the value through shell history or process inspection. This cycle also corrected the existing `scripts/smoke/provision-staging-secrets.sh` helper to use the same stdin contract.

### Usage Examples

```bash
# staging web-cd deploy token
op read 'op://UBM-Hyogo/Cloudflare API Token (staging)/credential' | \
  gh secret set CLOUDFLARE_API_TOKEN --env staging

# production web-cd deploy token
op read 'op://UBM-Hyogo/Cloudflare API Token (production)/credential' | \
  gh secret set CLOUDFLARE_API_TOKEN --env production
```

### Verification

```bash
gh api repos/daishiman/UBM-Hyogo/environments/staging/secrets \
  --jq '.secrets[].name' | sort

gh api repos/daishiman/UBM-Hyogo/environments/production/secrets \
  --jq '.secrets[].name' | sort
```

Expected name-only output includes `CLOUDFLARE_API_TOKEN`. Do not print values, value hashes, token previews, Authorization headers, cookies, or decoded webhook URLs.

### Error And Edge Cases

| Case | Handling |
| --- | --- |
| `Verify CF token is present` fails | Treat as missing Environment Secret for the corresponding `staging` or `production` environment |
| `CLOUDFLARE_ACCOUNT_ID` missing | Fix GitHub Variables, not Environment Secrets |
| `staging-runtime-smoke` secret is missing | Use `runbooks/secret-provisioning.md` and `scripts/smoke/provision-staging-secrets.sh`; do not use web-cd runbooks |
| Secret value appears in docs/logs | Stop and rotate the token; remove leaked material from tracked artifacts |
| CLI contract changes again | Re-run `gh secret set --help` and update helper/runbooks in the same wave |

### User-Gated Operations

Secret mutation, Cloudflare token issuance/revoke, deploy run, commit, push, and PR creation remain user-gated. This close-out performed static/read-only verification and local syntax checks only.

# Manual Smoke Log

## Static 検証（2026-04-30）

| ID | 検証 | 結果 |
| --- | --- | --- |
| TC-S01 | `rg -n "secrets\\.CLOUDFLARE_ACCOUNT_ID" .github` | PASS（exit=1） |
| TC-S02 | `rg -n "vars\\.CLOUDFLARE_ACCOUNT_ID" .github/workflows \| wc -l` | PASS（6） |
| TC-S03 | `actionlint` | DEFERRED（ローカルに未インストール）。代替として Ruby `YAML.load_file` で対象 2 workflow を parse PASS |
| TC-S04 | `yamllint` | DEFERRED（ローカルに未インストール）。代替として `git diff --check` PASS |
| TC-S05 | `gh api repos/daishiman/UBM-Hyogo/actions/variables` / `actions/secrets` | PASS（Variable 登録あり、Secret 出力なし） |
| TC-S06 | `git diff -- .github/workflows/backend-ci.yml .github/workflows/web-cd.yml` | PASS（6 箇所のみ `secrets.` → `vars.`） |
| TC-S07 | `.github/workflows` 全体検索 | PASS（旧参照なし） |

## Runtime 検証

main マージ後に次を追記する。

- TC-R01: backend-ci deploy-production success
- TC-R02: web-cd deploy-production success
- TC-R03: Authentication error 不在
- TC-R04: missing accountId 系警告不在

# Phase 6: テスト拡充（staging dry-run）

## 目的

staging 3 Token を実際に発行・投入して、各 Token が必要な scope のみで deploy を完走できることを確認する。

## 実行手順

```bash
# 1) 各 staging Token で whoami が exit 0 になること
for SCOPE in WORKERS D1 PAGES; do
  CLOUDFLARE_API_TOKEN="$(op read "op://Cloudflare/CF_TOKEN_${SCOPE}_STAGING/credential")" \
    bash scripts/cf.sh whoami \
    | tee "outputs/phase-6/staging-whoami-${SCOPE}.log"
done

# 2) staging deploy を job 別に dry-run（GHA workflow_dispatch）
gh run list --workflow backend-ci.yml --ref dev -f dry_run=true \
  | tee outputs/phase-6/staging-dry-run.log

# 3) job 別 conclusion 確認
RUN_ID=$(gh run list --workflow backend-ci.yml --limit 1 --json databaseId -q '.[0].databaseId')
gh run view "$RUN_ID" --json jobs \
  | jq '.jobs[] | {name, conclusion}' \
  | tee outputs/phase-6/staging-job-conclusions.json
```

## 期待値

- 3 Token の `whoami` がすべて exit 0
- `staging-job-conclusions.json` で D1 migration / Workers deploy / Pages deploy がすべて `success`
- 各 job の log に `403 Forbidden` / `Authentication error` が含まれない（必要 scope の充足）

## 失敗時の切り分け

| 症状 | 原因候補 |
| --- | --- |
| D1 migration step で 403 | `CF_TOKEN_D1_STAGING` の scope に `D1:Edit` が欠けている |
| Workers deploy step で `Account ID not found` | `Account Settings:Read` 欠落 |
| Pages deploy step で 401 | Token 値が GitHub Secrets に正しく投入されていない |

## 成果物

- `outputs/phase-6/staging-whoami-WORKERS.log`
- `outputs/phase-6/staging-whoami-D1.log`
- `outputs/phase-6/staging-whoami-PAGES.log`
- `outputs/phase-6/staging-dry-run.log`
- `outputs/phase-6/staging-job-conclusions.json`

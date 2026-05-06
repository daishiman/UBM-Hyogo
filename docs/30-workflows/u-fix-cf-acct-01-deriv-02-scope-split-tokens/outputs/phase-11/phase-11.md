# Phase 11: 手動実機検証（NON_VISUAL）

## visualEvidence: NON_VISUAL の根拠

本タスクは UI を含まず、Cloudflare ダッシュボード操作・GitHub Secrets 投入・GHA workflow 実行の組み合わせ。screenshot より JSON / log evidence が証跡として優位なため NON_VISUAL を採用する。

## 手動実機検証手順

### Step A: Token 発行（Cloudflare ダッシュボード）

1. Cloudflare ダッシュボード → My Profile → API Tokens → Create Token
2. 6 Token を `outputs/phase-2/phase-2.md` の scope 表に従い発行
3. 各 Token を 1Password の `Cloudflare` Vault に `CF_TOKEN_<SCOPE>_<ENV>` 名で保管
4. 発行画面を screenshot ではなく **Token name + scope の JSON manifest** として `outputs/phase-11/token-issuance-evidence.json` に記録（実値は記録しない）

### Step B: GitHub Secrets 投入

```bash
for SCOPE in WORKERS D1 PAGES; do
  for ENV in STAGING PRODUCTION; do
    SECRET_NAME="CF_TOKEN_${SCOPE}_${ENV}"
    ENV_LOWER="$(printf '%s' "$ENV" | tr '[:upper:]' '[:lower:]')"
    op read "op://Cloudflare/${SECRET_NAME}/credential" \
      | gh secret set "${SECRET_NAME}" --env "$ENV_LOWER" --repo daishiman/UBM-Hyogo
  done
done

for ENV in staging production; do
  gh secret list --env "$ENV" --repo daishiman/UBM-Hyogo
done | tee outputs/phase-11/github-secret-list.json
```

期待: 6 件の `CF_TOKEN_*_*` が存在し、旧 `CLOUDFLARE_API_TOKEN` も 24h 並行保持期間中は残存。

### Step C: staging 7 日 green 観測

dev ブランチへの自然な merge で `backend-ci.yml` と `web-cd.yml` を 7 日連続成功させる。

```bash
# 観測期間後の確認
gh run list --branch dev --workflow backend-ci.yml --limit 30 \
  --json conclusion,createdAt \
  | tee outputs/phase-11/staging-backend-7day-window.json
gh run list --branch dev --workflow web-cd.yml --limit 30 \
  --json conclusion,createdAt \
  | jq '[.[] | select(.createdAt > (now - 86400*7 | todate))] | group_by(.conclusion) | map({conclusion: .[0].conclusion, count: length})' \
  | tee outputs/phase-11/staging-7day-green-evidence.json
```

期待: `conclusion: success` が 100%。

### Step D: production 展開

```bash
# main への merge で backend-ci.yml が発火、各 job conclusion 確認
RUN_ID=$(gh run list --branch main --workflow backend-ci.yml --limit 1 --json databaseId -q '.[0].databaseId')
gh run view "$RUN_ID" --json jobs \
  | tee outputs/phase-11/production-deploy-jobs.json
```

期待: `backend-ci.yml` の D1 migration / Workers deploy と `web-cd.yml` の Pages deploy がすべて `success`。

### Step E: 旧単一 Token 失効

production deploy 成功 + 24h 経過後、Cloudflare ダッシュボードで旧 `CLOUDFLARE_API_TOKEN` を `Roll` ではなく `Delete`。

```bash
# 失効後 GitHub Secret も削除
gh secret delete CLOUDFLARE_API_TOKEN --env staging --repo daishiman/UBM-Hyogo
gh secret delete CLOUDFLARE_API_TOKEN --env production --repo daishiman/UBM-Hyogo

# 失効確認: 旧 token で whoami が 401 になること（手元控えがある場合のみ）
```

成果物: `outputs/phase-11/old-token-retirement-evidence.json`

## 状態語彙

- Step C 完了時点: `staging_7day_green` （runtime 観測完了）
- Step D 完了時点: `production_deployed_runtime_pending`（24h 並行期間中）
- Step E 完了時点: `PASS_BOUNDARY_SYNCED_RUNTIME_DONE`（ブラスト半径削減完了）

## 成果物

- `outputs/phase-11/token-issuance-evidence.json`
- `outputs/phase-11/github-secret-list.json`
- `outputs/phase-11/staging-7day-green-evidence.json`
- `outputs/phase-11/production-deploy-jobs.json`
- `outputs/phase-11/old-token-retirement-evidence.json`

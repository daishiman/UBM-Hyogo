# 2026-05-05 issue351 post-release dashboard automation

Issue #351 の post-release dashboard automation 仕様を aiworkflow-requirements に同期した。

- workflow root: `docs/30-workflows/issue-351-09c-post-release-dashboard-automation/`
- state: `spec_created / implementation / NON_VISUAL`
- GitHub Actions 正本: `.github/workflows/post-release-dashboard.yml`
- collector 正本: `scripts/post-release-dashboard/`
- Cloudflare API wrapper: `scripts/cf.sh api-post /client/v4/graphql -d <json>`
- read-only secret: `CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY`
- artifact path: `outputs/post-release-dashboard/<UTC-yyyy-mm-dd>/dashboard.{json,md}`
- evidence: `outputs/phase-11/` に structure / grep / dataset discover / dry-run / redaction / schema check を保存する
- user gate: commit / push / PR / real workflow dispatch / schedule verification は user 明示承認後のみ

# Cloudflare OIDC Support Revalidation

> Source issue: #717
> Date: 2026-05-16
> Verdict: `verified_current_no_code_change_pending_pr`

## Summary

Cloudflare Workers の GitHub Actions deploy 経路について、2026-05-16 時点の一次情報では `wrangler deploy` / `cloudflare/wrangler-action` が GitHub OIDC token exchange を公式 deploy 認証として使う手順を確認できなかった。

そのため、本 cycle では `.github/workflows/web-cd.yml` に `id-token: write` や仮 exchange step を追加しない。Issue #640 で確立した step-scoped `CLOUDFLARE_API_TOKEN` を current runtime contract として維持し、OIDC full migration は「公式サポートが確認できた時だけ実装へ進む conditional task」として閉じる。

## Primary Source Snapshot

| Source | Checked fact | Decision impact |
|---|---|---|
| Cloudflare Workers docs: GitHub Actions (`developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/`, last updated 2026-04-30) | CI/CD authentication section describes Cloudflare account ID and API token. Example workflow passes `apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}` to `cloudflare/wrangler-action@v3`. | No supported OIDC exchange path is documented for Workers deploy. |
| `cloudflare/wrangler-action` README (`github.com/cloudflare/wrangler-action`, checked 2026-05-16) | Authentication section instructs using GitHub Secrets and `apiToken`; examples use `apiToken` and `accountId`. No `id-token`, `oidc`, or workload federation input is documented. | Do not invent an action input or manual Cloudflare token exchange endpoint. |
| Local aiworkflow requirements (`deployment-secrets-management.md`, `deployment-gha.md`) | Current fact says web-cd keeps environment-scoped `CLOUDFLARE_API_TOKEN` until token split/OIDC cutover is explicitly executed. Issue #640 step-scoped boundary is canonical. | Preserve current secret name and step scope. |

## Decision

| Option | Result | Reason |
|---|---|---|
| Implement OIDC now in `web-cd.yml` | Rejected | Would require undocumented Cloudflare exchange endpoint or non-existent `wrangler-action` input. |
| Keep API token step-scoped and record no-code verification | Accepted | Matches Cloudflare official docs and repository current contract. |
| Create future production cutover / revocation tasks now | Accepted for detection/formalization | Downstream work remains useful but must be blocked by official OIDC support and staging proof. |

## Verification Commands

```bash
rg -n "CLOUDFLARE_API_TOKEN|id-token|wrangler-action" .github/workflows .claude/skills/aiworkflow-requirements/references/deployment-{gha,secrets-management}.md
cmp -s docs/30-workflows/issue-717-oidc-cf-full-migration/artifacts.json docs/30-workflows/issue-717-oidc-cf-full-migration/outputs/artifacts.json
```

## Gate Result

| Condition | Result |
|---|---|
| 矛盾なし | PASS: unsupported OIDC does not become repo code. |
| 漏れなし | PASS: Phase 12 strict outputs and downstream tasks capture the remaining work. |
| 整合性あり | PASS: state vocabulary is `verified_current_no_code_change_pending_pr` / `conditional`. |
| 依存関係整合 | PASS: legacy token revocation remains blocked by future supported OIDC cutover and observation. |

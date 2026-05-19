# Cloudflare OIDC Support Revalidation

Checked at: 2026-05-17

Primary sources:

- Cloudflare Workers GitHub Actions docs: https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/
- `cloudflare/wrangler-action` Issue #402: https://github.com/cloudflare/wrangler-action/issues/402
- `cloudflare/wrangler-action` README: https://github.com/cloudflare/wrangler-action

Result:

- Cloudflare Workers GitHub Actions docs still document API token authentication with `apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}`.
- `cloudflare/wrangler-action#402` is still open in the observed search result.
- README examples still center `apiToken` / `accountId`; no supported OIDC input, audience, or exchange endpoint is fixed for this repository.

Decision:

- Keep `.github/workflows/web-cd.yml` on step-scoped `secrets.CLOUDFLARE_API_TOKEN`.
- Do not add `permissions: id-token: write` or an inferred exchange step in this cycle.
- Implement only pre-support hardening: claim pin dry-run, redaction extension, manual observation gate, current-baseline comment, and system-spec sync.

# 2026-05-09 Issue #331 CI/CD runtime warning cleanup

Issue #331 was synced as `implemented-local / implementation / NON_VISUAL / local-static PASS / runtime evidence pending_user_approval`.

## Current Facts

- `apps/api/wrangler.toml` no longer has top-level `[vars]`; environment vars live under `[env.production.vars]` and `[env.staging.vars]`.
- `.github/workflows/web-cd.yml` no longer runs Cloudflare Pages deploy. It builds the OpenNext Workers bundle via `pnpm --filter @ubm-hyogo/web build:cloudflare` and deploys with `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env <staging|production>`.
- `web-cd.yml` supports `workflow_dispatch` for manual staging verification.
- `CLOUDFLARE_PAGES_PROJECT` is deprecated for Web CD after this cutover.
- `CLOUDFLARE_API_TOKEN` remains the current runtime secret; `CF_TOKEN_*` split/OIDC remains a separate target contract.
- `deployment-cloudflare.md`, `deployment-core.md`, `deployment-secrets-management.md`, `deployment-branch-strategy.md`, and manual spec `08-free-database.md` no longer describe current Web CD as Pages deploy.

## User-Gated Boundaries

- `gh workflow run web-cd.yml --ref dev`
- production deploy warning-zero evidence
- Cloudflare Pages project retirement
- GitHub secret/variable mutation
- commit, push, PR

Issue #331 is CLOSED; downstream PRs must use `Refs #331`.

# 2026-05-16 Issue #717 OIDC Support Revalidation

Issue #717 was synchronized as `verified_current_no_code_change_pending_pr / implementation / NON_VISUAL / conditional`.

Primary-source revalidation found that Cloudflare Workers GitHub Actions docs and `cloudflare/wrangler-action` README still document API token authentication for Wrangler deploy. The repo therefore keeps Issue #640's step-scoped `CLOUDFLARE_API_TOKEN` boundary and does not add `id-token: write` or a guessed OIDC exchange step.

Updated:

- `references/deployment-secrets-management.md`
- `references/task-workflow-active.md`
- `indexes/quick-reference.md`
- `indexes/resource-map.md`
- `references/workflow-issue-717-oidc-cf-full-migration-artifact-inventory.md`
- `docs/30-workflows/issue-717-oidc-cf-full-migration/outputs/phase-12/*`
- `docs/30-workflows/unassigned-task/issue-717-followup-*.md`

User-gated: commit, push, PR, Cloudflare mutation, GitHub Secret mutation, deploy execution.

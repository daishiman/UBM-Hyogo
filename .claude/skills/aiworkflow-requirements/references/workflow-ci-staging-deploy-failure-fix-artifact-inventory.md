# Workflow Artifact Inventory: ci-staging-deploy-failure-fix

| Category | Path | Role |
| --- | --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/ci-staging-deploy-failure-fix/` | Phase 1-13, task specs, Phase 11/12 evidence, Phase 13 user gate |
| implementation | `.github/workflows/web-cd.yml` | OpenNext build-time env injection for staging / production |
| implementation test | `apps/web/src/lib/__tests__/build-time-env.spec.ts` | EnvSchema build-time placeholder contract |
| token recovery runbook | `docs/30-workflows/completed-tasks/ci-staging-deploy-failure-fix/outputs/task-02-cf-api-token-d1-permission-restore/runbook.md` | Cloudflare API token rotation / incident response |
| artifacts parity | `docs/30-workflows/completed-tasks/ci-staging-deploy-failure-fix/artifacts.json` and `outputs/artifacts.json` | root/output mirror |
| Phase 12 strict 7 | `docs/30-workflows/completed-tasks/ci-staging-deploy-failure-fix/outputs/phase-12/` | compliance close-out |
| aiworkflow sync | `indexes/quick-reference.md`, `indexes/resource-map.md`, `references/task-workflow-active.md`, `references/deployment-cloudflare-opennext-workers.md`, `references/lessons-learned-ci-pipeline-recovery-2026-05.md` | same-wave SSOT sync |

## User-gated operations

- Cloudflare API token creation / rotation
- 1Password token field update
- `gh secret set CLOUDFLARE_API_TOKEN --env staging`
- `gh secret set CLOUDFLARE_API_TOKEN --env production`
- `git commit`, `git push`, `gh pr create`
- dev push runtime CI verification


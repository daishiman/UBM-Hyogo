# System spec update summary

## Step 1-A: Task completion record

Added this workflow to aiworkflow-requirements same-wave surfaces:

- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md`
- `.claude/skills/aiworkflow-requirements/references/lessons-learned-ci-pipeline-recovery-2026-05.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-ci-staging-deploy-failure-fix-artifact-inventory.md`
- `.claude/skills/aiworkflow-requirements/changelog/20260520-ci-staging-deploy-failure-fix.md`
- `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md`

## Step 1-B: Implementation status

`ci-staging-deploy-failure-fix` is `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING / implementation / NON_VISUAL`.

task-01 is implemented locally. task-02 remains external-ops pending because Cloudflare / GitHub Secret mutation requires user approval.

## Step 1-C: Related task status

| Related task | Status |
| --- | --- |
| task-01-web-build-env-injection | implemented_local |
| task-02-cf-api-token-d1-permission-restore | external_ops_pending_user_approval |
| issue-762 OIDC cutover | independent; not changed |
| issue-718 legacy token revocation | independent; not changed |

## Step 2: System spec update

Required. The OpenNext Workers deployment spec now records that CI build steps must inject build-time env from `apps/web/wrangler.toml` while keeping deploy secrets step-scoped. The deployment secrets spec now records current `backend-ci.yml` / `web-cd.yml` usage of GitHub Environment `CLOUDFLARE_API_TOKEN` and treats `CF_TOKEN_D1_*` / `CF_TOKEN_WORKERS_*` as historical names, not current backend-ci consumers.

## Artifacts parity

`artifacts.json` and `outputs/artifacts.json` are both present and are intended to be byte-identical. Verified with:

```bash
cmp -s docs/30-workflows/completed-tasks/ci-staging-deploy-failure-fix/artifacts.json docs/30-workflows/completed-tasks/ci-staging-deploy-failure-fix/outputs/artifacts.json
```

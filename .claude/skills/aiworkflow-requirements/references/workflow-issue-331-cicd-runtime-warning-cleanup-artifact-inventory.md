# Issue #331 CI/CD Runtime Warning Cleanup Artifact Inventory

## Workflow Root

`docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/`

## Classification

`implemented-local / implementation / NON_VISUAL / local-static PASS / runtime evidence pending_user_approval / Phase 13 blocked_until_user_approval`

## Primary Repo Changes

| Path | Role |
| --- | --- |
| `apps/api/wrangler.toml` | Removed top-level `[vars]`; production/staging vars are the only runtime env var sources. |
| `.github/workflows/web-cd.yml` | Replaced Pages deploy with OpenNext Workers build and `scripts/cf.sh deploy`; added `workflow_dispatch`. |
| `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | Synced Web CD current facts and Cloudflare token current/target boundary. |
| `.claude/skills/aiworkflow-requirements/references/deployment-core.md` | Synced deployment flow to Workers via `scripts/cf.sh`. |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | Removed stale Pages deploy current facts; Web CD now points to OpenNext Workers deploy. |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | Synced `CLOUDFLARE_API_TOKEN` as current runtime and `CF_TOKEN_PAGES_*` as deprecated target. |
| `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` | Synced Web CD trigger table to Workers deploy. |
| `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | Marked `CLOUDFLARE_PAGES_PROJECT` deprecated after Web CD cutover. |
| `docs/00-getting-started-manual/specs/08-free-database.md` | Synced manual spec from Pages deploy to OpenNext Workers deploy. |

## Consumed / Superseded Trace

| Source | Relationship |
| --- | --- |
| `docs/30-workflows/completed-tasks/fix-cf-account-id-vars-reference/U-FIX-CF-ACCT-02-cicd-runtime-warning-cleanup.md` | Superseded by Issue #331 implementation. |
| `docs/30-workflows/unassigned-task/task-impl-opennext-workers-migration-001.md` | Web CD Pages-to-Workers repo cutover consumed for the workflow file portion; Cloudflare-side Pages retirement remains user-gated. |
| `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-pages-vs-workers-decision/` | ADR decision consumed; implementation now follows Workers deploy contract. |

## Runtime Boundary

GitHub Actions execution, production deploy logs, Cloudflare project retirement, and secret mutation remain user-gated. Issue #331 is CLOSED, so PR text must use `Refs #331`.

## Lessons Learned

- `lessons-learned/lessons-learned-issue-331-cicd-runtime-warning-cleanup-2026-05.md`（L-331-001..005: env-scoped vars 集約 / repo-side cutover scope 分離 / `scripts/cf.sh` 単一入口 / CLOSED issue は `Refs` only / local-static PASS と runtime evidence の独立明示）

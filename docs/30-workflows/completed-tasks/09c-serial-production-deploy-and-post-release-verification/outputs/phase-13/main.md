# Phase 13 Output: PR Preparation

Status: spec_created  
Runtime evidence: pending_user_approval

## Scope

This file prepares the PR phase template. It does not create a PR and does not update root `artifacts.json`.

## Local Check Template

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

| Check | Runtime result |
| --- | --- |
| `pnpm lint` | TBD at execution |
| `pnpm typecheck` | TBD at execution |
| `pnpm test` | TBD at execution |
| `pnpm build` | TBD at execution |

## Change Summary Template

| Category | Paths |
| --- | --- |
| Added | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/index.md`, `artifacts.json`, `phase-01.md` through `phase-13.md`, `outputs/**` |
| Added | `docs/30-workflows/unassigned-task/task-09c-*.md` follow-up task files |
| Modified | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`, `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`, `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` |
| Modified | 09c path references in upstream workflow docs under `docs/30-workflows/02-application-implementation/` |
| Deleted | old nested 09c workflow path under `docs/30-workflows/02-application-implementation/09c-serial-production-deploy-and-post-release-verification/` |

## Approval Gate 3/3

```text
[ APPROVAL REQUIRED - PRODUCTION RELEASE GATE 3/3 / FINAL ]
Phase: 13
PR base: dev
PR head: feature/09c-production-deploy-and-post-release-verification
Runtime evidence: TBD at execution

Create PR? [y/N]
```

Approval result: pending_user_approval.

## PR Command Template

```bash
gh pr create \
  --base dev \
  --head feature/09c-production-deploy-and-post-release-verification \
  --title "docs(09c): production deploy + release tag + 24h post-release verification 仕様書" \
  --body-file docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-13/pr-body.md
```

PR URL: TBD at execution.

## dev to main Promotion

After the dev PR is merged, create a separate dev-to-main PR following repository branch rules. Do not push directly to main.

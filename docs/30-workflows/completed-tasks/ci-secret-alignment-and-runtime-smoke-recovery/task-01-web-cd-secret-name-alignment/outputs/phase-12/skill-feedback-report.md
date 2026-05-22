# Skill Feedback Report

## Template Improvements

| finding | route | decision |
|---|---|---|
| Small NON_VISUAL implementation tasks still need Phase 12 strict 7 outputs | task-specification-creator | existing rule already covers this; no template change |

## Workflow Improvements

| finding | route | decision |
|---|---|---|
| Untracked spec roots can drift from referenced parent roots | task spec authoring | fixed by moving task-01 under parent workflow root |
| Runtime evidence must not be marked completed before push/CI | task-specification-creator state vocabulary | applied with `runtime_pending` |

## Documentation Improvements

| finding | route | decision |
|---|---|---|
| aiworkflow current facts still described `web-cd.yml` as using `CF_TOKEN_WORKERS_*` | aiworkflow-requirements | updated `deployment-gha.md`, quick-reference, resource-map, task-workflow-active, changelog, LOGS |
| deployment secrets正本 still marked `CLOUDFLARE_API_TOKEN` deprecated for web-cd | aiworkflow-requirements | updated `deployment-secrets-management.md` to split backend and web-cd current facts |

## No-op Items

No new skill rule is required. The existing Phase 12 and runtime-pending rules were sufficient.

# Skill Feedback Report

## Template Improvement

`task-specification-creator` should warn when a workflow spec references non-existent `.github/workflows/*.yml` files. This task initially referenced `deploy-staging.yml` / `deploy-production.yml`, but the current repo uses `backend-ci.yml` / `web-cd.yml`.

## Workflow Improvement

For NON_VISUAL deployment tasks, Phase 12 should separate local static evidence from runtime evidence. The correct boundary here is local YAML/script PASS plus runtime token issuance pending user operation.

## Documentation Improvement

`aiworkflow-requirements` deployment secret docs should keep a dedicated deprecated-secret row when replacing a live CI secret. The old `CLOUDFLARE_API_TOKEN` must remain documented for the 24h parallel window and then be removed with evidence.

## Routing

| Item | Owner | Action |
| --- | --- | --- |
| Non-existent workflow reference guard | `task-specification-creator` | promoted to `.claude/skills/task-specification-creator/references/phase-template-phase8-10.md` and `references/phase12-skill-feedback-promotion.md` |
| Runtime pending boundary language | `task-specification-creator` | already covered by `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`; no-op reason recorded in Phase 12 compliance |
| Deprecated secret row | `aiworkflow-requirements` | applied in this wave |

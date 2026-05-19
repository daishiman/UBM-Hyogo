# System Spec Update Summary

## Summary
Same-wave aiworkflow sync was required because a new canonical workflow root was created from two source unassigned tasks and then implemented locally.

## Updated Ledgers
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-issue-274-public-pages-ogp-sitemap-robots-artifact-inventory.md`
- `.claude/skills/aiworkflow-requirements/changelog/20260517-issue274-public-pages-ogp-sitemap-robots.md`
- `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md`

## No-op Areas
No API contract, database schema, admin UI, production secret, deployment config, or external runtime state changed in this cycle.

## Implemented Areas
- Public metadata route behavior in `apps/web/app/sitemap.ts`, `robots.ts`, and `opengraph-image.tsx`
- Root and public page metadata in `apps/web/app/layout.tsx`, `/`, `/members`, `/members/[id]`, `/register`
- SEO helper host alignment with `apps/web/wrangler.toml` `AUTH_URL`
- Unit and Playwright smoke coverage for public metadata

# login-ui-balance-and-runtime-fix lessons (2026-05)

## L-LOGIN-001: P50 must record detached HEAD / branch context

When a workflow is created from a detached or generated worktree, Phase 1 must record `git status -sb` and the intended feature branch. Otherwise Phase 13 instructions can imply a branch that does not exist yet.

## L-LOGIN-002: Staging console noise needs source classification

Browser extension logs can look like application runtime errors. Classify by host/port ownership, bundle naming, and explicit browser-extension wording before putting the item in scope.

## L-LOGIN-003: Runtime env direct access should get a grep gate

If a staging failure is caused by direct `process.env.INTERNAL_API_BASE_URL` access in `apps/web`, the same wave should add a narrow regression grep gate and route code through `apps/web/src/lib/env.ts` accessors.

## L-LOGIN-004: Dev-only CDN prototypes need a serving contract

Prototype HTML that loads `.jsx` and CDN scripts should use pinned CDN URLs without stale SRI hashes and should document a local HTTP server that serves `.jsx` as JavaScript.

# Implementation Guide

## Part 1

Playwright のテスト整備は、学校の持ち物チェック表を整える作業に近い。何を持ってくるか、どの順番で確認するか、忘れ物がある時にどう気づくかを同じ紙にまとめる。

## Part 2

Stage 0 is an implementation / NON_VISUAL cleanup cycle. It changes real files, not only outputs:

1. `apps/web/playwright/README.md` documents the standard suite, critical routes, un-skip invariant, auth fixture, and project filters.
2. `apps/web/package.json` fixes standard E2E commands to `desktop-chromium`, `desktop-firefox`, and `mobile-webkit`.
3. `apps/web/playwright.config.ts` excludes `profile-readonly-logged-in.spec.ts` from standard projects and adds the opt-in `evidence-capture` project.
4. `apps/web/playwright/tests/profile-readonly-logged-in.spec.ts` owns the authenticated readonly profile evidence capture.
5. `profile-visibility-request.spec.ts` and `profile-delete-request.spec.ts` no longer carry stale `test.describe.skip` activation comments.
6. `.claude/skills/task-specification-creator/references/quality-gates.md` records the narrow evidence-capture exception and tier-aware E2E coverage policy.
7. `.claude/skills/aiworkflow-requirements/` indexes Stage 0 as implemented-local and Stage 1-3 as spec packages with pending dependencies.

Evidence:

- `outputs/phase-11/evidence/e2e-run.log`: list smoke, typecheck, and lint evidence. It does not claim full runtime E2E PASS.
- `outputs/phase-11/evidence/e2e-skip-count.txt`: standard skip count remains 0; one evidence-only skip is allowed.
- `outputs/phase-11/evidence/runner-version.txt`: pinned Playwright package evidence.
- Screenshots are not required because this workflow is `visualEvidence=NON_VISUAL`.

PR boundary:

- Stage 0 implementation is local complete pending PR.
- Stage 1-3 are `spec_verified_pending_dependency`; CI, Lighthouse, coverage enforcement, and branch protection application are not claimed as implemented by this Stage 0 PR.

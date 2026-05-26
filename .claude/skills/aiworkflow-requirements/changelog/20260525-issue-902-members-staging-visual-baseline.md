# 2026-05-25 Issue #902 members staging visual baseline

Issue #902 / UT-DSF-07-FU-02 was implemented locally as `implemented_local_runtime_pending / implementation / VISUAL`.

Synchronized:

- `docs/30-workflows/completed-tasks/issue-902-members-staging-visual-baseline/`
- `apps/web/playwright/tests/visual-staging/members-list.spec.ts`
- `apps/web/playwright/tests/visual-staging/member-detail.spec.ts`
- `.github/workflows/playwright-smoke.yml`
- `references/workflow-issue-902-members-staging-visual-baseline-artifact-inventory.md`
- `lessons-learned/lessons-learned-issue-902-members-staging-visual-baseline-2026-05.md`（L-I902-001..004: env-gated `[id]` + `test.skip` / staging baseline `-linux.png` 正本・`-darwin.png` 禁止 / SSR Worker fetch は `page.route()` stub 不可 / workflow root rename と `.github/workflows/*.yml` + `artifacts.json.gates[].evidence_path` + consumed unassigned `canonical_workflow:` を同 wave 修正）
- `references/lessons-learned.md` hub に L-I902 行を追記

Runtime staging deploy, CI baseline PNG generation, commit, push, and PR remain user-gated.


# Phase 12 Task Spec Compliance Check

## Summary verdict
`implemented_local_evidence_captured / implementation / VISUAL`. App implementation, local command evidence, curl evidence, Playwright smoke, and OG image artifact are captured. Phase 13 remains `blocked_pending_user_approval`.

## Changed-files classification
- Code: `apps/web/app/**`, `apps/web/src/lib/seo/**`, `apps/web/playwright/tests/public-metadata.spec.ts`
- Workflow docs: `docs/30-workflows/issue-274-public-pages-ogp-sitemap-robots/**`
- Source task traces: `docs/30-workflows/unassigned-task/task-06a-followup-002-ogp-sitemap.md`, `docs/30-workflows/unassigned-task/task-11-followup-002-public-og-sitemap-robots.md`
- Formal follow-up: `docs/30-workflows/unassigned-task/task-issue-274-followup-001-dynamic-member-og-image.md`
- aiworkflow ledgers: quick-reference, resource-map, task-workflow-active, artifact inventory, changelog, LOGS, SKILL-changelog, SKILL.md

## `workflow_state` and phase status consistency
Root `artifacts.json` uses `metadata.workflow_state: implemented_local_evidence_captured`, `metadata.taskType: implementation`, and `metadata.visualEvidence: VISUAL`. Phase 1-12 are `completed`; Phase 13 is `blocked_pending_user_approval`.

## Phase 11 evidence file inventory
| Path | Status | Note |
| --- | --- | --- |
| `outputs/phase-11/evidence/typecheck.log` | present | pnpm typecheck output |
| `outputs/phase-11/evidence/lint.log` | present | pnpm lint output |
| `outputs/phase-11/evidence/test.log` | present | unit test output |
| `outputs/phase-11/evidence/build.log` | present | next build output |
| `outputs/phase-11/evidence/grep-gate.log` | present | grep gate output |
| `outputs/phase-11/evidence/playwright-smoke.log` | present | playwright smoke output |
| `outputs/phase-11/evidence/og-image-file.log` | present | og image file metadata |
| `outputs/phase-11/evidence/phase12-compliance-verify.log` | present | phase12 verify output |
| `outputs/phase-11/screenshots/og-image.png` | present | rendered og image |

## Phase 12 strict 7 file inventory
- `main.md`
- `implementation-guide.md`
- `phase12-task-spec-compliance-check.md`
- `system-spec-update-summary.md`
- `skill-feedback-report.md`
- `unassigned-task-detection.md`
- `documentation-changelog.md`

## Skill/reference/system spec same-wave sync
aiworkflow ledgers are updated for the implemented-local root:
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL-changelog.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-issue-274-public-pages-ogp-sitemap-robots-artifact-inventory.md`
- `.claude/skills/aiworkflow-requirements/changelog/20260517-issue274-public-pages-ogp-sitemap-robots.md`
- `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md`

Executable contract corrections included in the same wave:
- package filter is `@ubm-hyogo/web`
- Playwright spec path is `apps/web/playwright/tests/public-metadata.spec.ts`
- sitemap dynamic source is paginated `/public/members?limit=100&page=N`
- public member list item shape is top-level `memberId` / `fullName`
- site URL host matches `apps/web/wrangler.toml` `AUTH_URL`

## Runtime or user-gated boundary
Local runtime evidence is captured. Commit, push, PR, deployed production verification, and Issue mutation are pending explicit user approval. PR text uses `Refs #274`.

## Archive/delete stale-reference gate
The two source unassigned tasks remain as physical trace files and are marked consumed with `canonical_workflow` pointers. They are not deleted in this cycle.

## Four-condition verdict
| Condition | Verdict | Evidence |
| --- | --- | --- |
| 矛盾なし | PASS | State, implementation diff, Phase 11 evidence, and aiworkflow ledgers all use implemented-local wording. |
| 漏れなし | PASS | Code, tests, Phase 11 evidence, Phase 12 strict 7, source traces, formal follow-up, and skill ledgers are present. |
| 整合性あり | PASS | `workflow_state`, `taskType`, `visualEvidence`, phase statuses, and canonical evidence paths use one vocabulary. |
| 依存関係整合 | PASS | Metadata/sitemap/robots share `getSiteUrl()`; `getSiteUrl()` matches wrangler `AUTH_URL`; sitemap uses public API only. |

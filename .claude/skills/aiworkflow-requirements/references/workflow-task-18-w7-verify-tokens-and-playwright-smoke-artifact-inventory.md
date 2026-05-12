# task-18 W7 verify-tokens-and-playwright-smoke Artifact Inventory

## Metadata

| Item | Value |
| --- | --- |
| Task ID | task-18-w7-verify-tokens-and-playwright-smoke |
| Workflow | `docs/30-workflows/task-18-w7-verify-tokens-and-playwright-smoke/` |
| Status | `implemented-local / implementation / NON_VISUAL / runtime_pending` |
| Sync date | 2026-05-12 |
| Phase 11 | static evidence captured / runtime evidence pending_user_approval |
| Phase 12 | strict 7 outputs present |
| Phase 13 | `blocked_pending_user_approval`（commit / push / PR / branch protection PUT） |

## Implementation Artifacts

| Area | Path |
| --- | --- |
| Token drift verifier | `scripts/verify-design-tokens.ts` |
| Verifier unit test | `scripts/verify-design-tokens.test.ts` |
| Playwright config | `apps/web/playwright.config.ts` |
| Playwright auth fixture | `apps/web/playwright/fixtures/auth.ts` |
| Smoke spec (17 URL routes) | `apps/web/playwright/tests/full-smoke.spec.ts` |
| Visual baseline specs (4 screens) | `apps/web/playwright/tests/visual/*.spec.ts` |
| Admin SSR fixture branch | `apps/web/src/lib/admin/server-fetch.ts` |
| Design token SSOT (spec) | `docs/00-getting-started-manual/specs/09b-design-tokens.md` |
| Design tokens (CSS) | `apps/web/src/styles/tokens.css` |
| Theme bridge | `apps/web/src/styles/globals.css` (`@theme inline`) |
| Verify workflow | `.github/workflows/verify-design-tokens.yml` |
| Smoke workflow | `.github/workflows/playwright-smoke.yml` |
| Root manifest | `package.json` (`verify:tokens` script) |
| Web manifest | `apps/web/package.json` (`e2e:smoke`, `e2e:visual` scripts) |

## Phase 12 Outputs

| File | Purpose |
| --- | --- |
| `outputs/phase-12/main.md` | Phase 1-13 summary, 7 outputs list |
| `outputs/phase-12/implementation-guide.md` | 中学生 / 技術者の二部構成 |
| `outputs/phase-12/system-spec-update-summary.md` | 09b / 00-overview / CLAUDE.md / aiworkflow sync |
| `outputs/phase-12/documentation-changelog.md` | validator 実行記録 |
| `outputs/phase-12/unassigned-task-detection.md` | full visual regression suite 起票 |
| `outputs/phase-12/skill-feedback-report.md` | テンプレ改善 3 件 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | 8/8 checks passed |

## Required Status Check Candidates

| Context | Source workflow | Gate |
| --- | --- | --- |
| `verify-design-tokens / verify-design-tokens` | `.github/workflows/verify-design-tokens.yml` | 3 層 token bridge drift |
| `playwright-smoke / smoke (chromium)` | `.github/workflows/playwright-smoke.yml` | 17 URL routes 反応性 |
| `playwright-smoke / visual (chromium, 4 screens)` | `.github/workflows/playwright-smoke.yml` | `/login` / `/` / `/admin` / `/profile` visual baseline |

## Evidence Boundary

- Canonical evidence: tracked `.txt` / `.json` のみ
- `.log` evidence: `.gitignore` で除外されるため非 canonical
- visual baseline `*.png` snapshot は `apps/web/playwright/tests/visual/<spec>-snapshots/` に tracked
- runtime evidence（CI green）は Phase 13 user approval 後の workflow run で取得

## User Gates

- commit / push / PR creation
- `gh api -X PUT repos/.../branches/{dev,main}/protection` による required check 追加
- visual baseline `--update-snapshots` 実行

## Dependencies

- Upstream: task-08 (tokens 整備) / task-09 (login) / task-10 (UI primitives) / task-11..17 (画面群)
- Downstream: `task-18-full-visual-regression-suite-001`（17 URL routes × 3 viewport の拡張 baseline）

## Cross-Reference

- Lessons: `references/lessons-learned-task-18-w7-verify-tokens-and-playwright-smoke-2026-05.md`
- Changelog: `changelog/20260512-task-18-w7-verify-tokens-and-playwright-smoke.md`
- Resource map: `indexes/resource-map.md` (末尾 task-18 行)
- Quick reference: `indexes/quick-reference.md` §Task 18 W7 verify tokens and Playwright smoke
- Task workflow: `references/task-workflow-active.md` §Task 18 W7 verify tokens and Playwright smoke
- Branch protection: `references/branch-protection.md` §Required status check candidates
- Playwright reference: `references/testing-playwright-e2e.md`

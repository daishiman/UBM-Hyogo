# Documentation Changelog

## Updated Files

| Path | Change |
| --- | --- |
| `docs/30-workflows/task-18-w7-verify-tokens-and-playwright-smoke/` | Normalized Phase 1-13 spec, artifacts, and outputs. |
| `docs/00-getting-started-manual/specs/09b-design-tokens.md` | Added verifier bridge rule. |
| `docs/00-getting-started-manual/specs/00-overview.md` | Added CI regression gate summary. |
| `CLAUDE.md` | Added task-18 required status candidates. |
| `.claude/skills/aiworkflow-requirements/` | Added active/index/changelog sync. |
| `.github/workflows/verify-design-tokens.yml` | Added design token drift CI context. |
| `.github/workflows/playwright-smoke.yml` | Added smoke / visual CI context candidates. |
| `scripts/verify-design-tokens.ts` / `scripts/verify-design-tokens.test.ts` | Added token drift verifier, theme bridge RHS check, and forbidden color literal gate. |
| `apps/web/playwright/tests/full-smoke.spec.ts` / `apps/web/playwright/tests/visual/*.spec.ts` | Added 17 URL smoke and 4 visual baseline specs. |

## Validator Record

| Command | Exit | Count |
| --- | --- | --- |
| `pnpm exec vitest run scripts/verify-design-tokens.test.ts` | 0 | 7 tests passed |
| `pnpm verify:tokens` | 0 | 88 tracked tokens, forbidden color literal scan clean |
| `pnpm --filter @ubm-hyogo/web typecheck` | 0 | web typecheck passed |
| `PLAYWRIGHT_EVIDENCE_TASK=task-18-w7 PLAYWRIGHT_TASK18_SMOKE=1 pnpm --filter @ubm-hyogo/web exec playwright test --list --project=smoke-chromium` | 0 | 17 tests listed |
| `PLAYWRIGHT_EVIDENCE_TASK=task-18-w7 PLAYWRIGHT_TASK18_SMOKE=1 pnpm --filter @ubm-hyogo/web exec playwright test --list --project=visual-chromium` | 0 | 4 tests listed |
| `PLAYWRIGHT_EVIDENCE_TASK=task-18-w7 PLAYWRIGHT_TASK18_SMOKE=1 pnpm --filter @ubm-hyogo/web exec playwright test --project=smoke-chromium` | 1 | blocked by local ENOSPC after 4 route checks |

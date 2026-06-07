# Documentation Changelog

## Entry Checklist

| Check | Result |
| --- | --- |
| `git status --porcelain apps/ packages/` | apps changes present in web UI and api seed files |
| `git diff --name-only -- apps/** packages/**` | web adapter/components/tests/styles and api seed generator/artifacts changed |
| infra/scripts/github fixtures | no infra or GitHub workflow changes |

## Changed Documentation

| Path | Role |
| --- | --- |
| `docs/30-workflows/completed-tasks/public-member-detail-survey-fields-richness/index.md` | workflow state corrected to implemented local runtime pending |
| `docs/30-workflows/completed-tasks/public-member-detail-survey-fields-richness/artifacts.json` | root artifact state and Phase 11/12 artifacts synced |
| `docs/30-workflows/completed-tasks/public-member-detail-survey-fields-richness/outputs/artifacts.json` | mirror artifact state synced |
| `docs/30-workflows/completed-tasks/public-member-detail-survey-fields-richness/outputs/phase-11/canonical-paths.json` | evidence inventory |
| `docs/30-workflows/completed-tasks/public-member-detail-survey-fields-richness/outputs/phase-12/*.md` | strict Phase 12 outputs |

## Validator Evidence

| Command | Result |
| --- | --- |
| focused Vitest command in `main.md` | PASS |
| `pnpm --filter @ubm-hyogo/api typecheck` | PASS |
| `pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| `pnpm lint:stablekey` | PASS |

## Review-Cycle Corrections

| Path | Correction |
| ---- | ---------- |
| `apps/web/src/lib/adapters/member-detail.ts` | `other` fallback now preserves source section `key/title` instead of collapsing all fields into a synthetic section |
| `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` | added regression coverage for multi-section `other` fallback preservation |
| `apps/web/playwright/fixtures/auth.ts` | added local mock API scenarios for full / sparse / message-hidden public member detail runtime capture |
| `apps/web/playwright/tests/public-member-detail-richness-screenshots.spec.ts` | added canonical Phase 11 screenshot capture for 3 public member detail states |
| `apps/web/src/styles/legacy-public.css` | fixed sticky public footer overlap found during screenshot review by returning footer to normal document flow |
| `docs/30-workflows/completed-tasks/public-member-detail-survey-fields-richness/outputs/phase-11/screenshots/*.png` | generated local runtime visual evidence |
| `docs/30-workflows/completed-tasks/public-member-detail-survey-fields-richness/phase-12.md` | fixed strict Phase 12 inventory count from mixed 6/7 wording to canonical 7 |
| `docs/30-workflows/completed-tasks/public-member-detail-survey-fields-richness/outputs/phase-12/implementation-guide.md` | restored required technical detail, identifier drift evidence, and Phase 11 screenshot references |
| `docs/30-workflows/completed-tasks/public-member-detail-survey-fields-richness/index.md` | removed stale Phase 12 planned wording and clarified runtime screenshot user-gated boundary |

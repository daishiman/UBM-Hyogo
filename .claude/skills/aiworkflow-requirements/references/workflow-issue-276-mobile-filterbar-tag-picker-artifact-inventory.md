# Workflow Artifact Inventory: issue-276-mobile-filterbar-tag-picker

## Metadata

| Item | Value |
| --- | --- |
| Workflow root | `docs/30-workflows/issue-276-mobile-filterbar-tag-picker/` |
| Issue | #276 |
| State | `implemented_local_runtime_pending / implementation / VISUAL` |
| Source task | `docs/30-workflows/unassigned-task/task-06a-followup-003-mobile-filterbar-tag-picker.md` |
| Parent | `06a-parallel-public-landing-directory-and-registration-pages` |

## Canonical Files

| Class | Path |
| --- | --- |
| workflow index | `docs/30-workflows/issue-276-mobile-filterbar-tag-picker/index.md` |
| root artifacts | `docs/30-workflows/issue-276-mobile-filterbar-tag-picker/artifacts.json` |
| output artifacts | `docs/30-workflows/issue-276-mobile-filterbar-tag-picker/outputs/artifacts.json` |
| Phase 12 compliance | `docs/30-workflows/issue-276-mobile-filterbar-tag-picker/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| Phase 11 boundary | `docs/30-workflows/issue-276-mobile-filterbar-tag-picker/outputs/phase-11/main.md` |

## Planned Implementation Targets

| Area | Paths |
| --- | --- |
| shared contract | `packages/shared/src/zod/viewmodel.ts`, shared type contract tests |
| API | `apps/api/src/view-models/public/public-member-list-view.ts`, public members route/use-case/repository files identified in Phase 2 |
| Web | `apps/web/src/components/public/MemberFilters.client.tsx`, new focused tag picker/mobile summary components, `apps/web/app/(public)/members/page.tsx` |
| E2E | `apps/web/playwright/tests/**/members-filter-mobile*.spec.ts` |

## Runtime Boundary

This inventory records local API/Web implementation plus the Phase 11 runtime evidence boundary. Commit, push, PR, and any external deployment remain user-gated.

## Lessons Learned

| Path | Topics |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-276-mobile-filterbar-tag-picker-2026-05.md` | L-I276-001 (4-layer sync 順序), L-I276-002 (URL canonical vs local state), L-I276-003 (a11y 4 点セット), L-I276-004 (3-point primitive split), L-I276-005 (公開境界 aggregate), L-I276-006 (mobile evidence 4-shot), L-I276-007 (4-spec sync matrix) |

## Pattern Reference

| Path | Purpose |
| --- | --- |
| `.claude/skills/task-specification-creator/references/patterns-mobile-ui-primitive-3point-sync.md` | filter / picker primitive 追加時に複製する 7 セクション pattern（layer 順序 / split rule / state matrix / a11y / 4-spec sync / visual evidence / phase-12 close-out 同期対象） |

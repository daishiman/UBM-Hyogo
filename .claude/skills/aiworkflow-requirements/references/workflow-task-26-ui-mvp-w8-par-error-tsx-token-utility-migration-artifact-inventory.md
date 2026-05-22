# Workflow Artifact Inventory: task-26 UI MVP W8 Error TSX Token Utility Migration

## Overview

| Item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/task-26-ui-mvp-w8-par-error-tsx-token-utility-migration/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL / Phase 13 pending_user_approval` |
| implementation | `apps/web/app/error.tsx`, `apps/web/app/not-found.tsx`, `apps/web/app/loading.tsx` |
| test | `apps/web/app/__tests__/error.component.spec.tsx` |
| visual evidence | `outputs/phase-11/screenshots/not-found-desktop.png` |

## Current Artifacts

| Layer | Paths |
| --- | --- |
| root workflow | `index.md`, `artifacts.json`, `outputs/artifacts.json` |
| Phase 11 | `outputs/phase-11/manual-test-result.md`, `outputs/phase-11/screenshot-plan.md`, `outputs/phase-11/screenshot-coverage.md`, `outputs/phase-11/screenshots/not-found-desktop.png` |
| Phase 12 strict 7 | `outputs/phase-12/main.md`, `implementation-guide.md`, `system-spec-update-summary.md`, `documentation-changelog.md`, `unassigned-task-detection.md`, `skill-feedback-report.md`, `phase12-task-spec-compliance-check.md` |
| aiworkflow sync | `indexes/quick-reference.md`, `indexes/resource-map.md`, `indexes/topic-map.md`, `indexes/keywords.json`, `references/task-workflow-active.md`, `LOGS/_legacy.md` |

## Boundary

Token SSOT (`docs/00-getting-started-manual/specs/09b-design-tokens.md`) and Tailwind bridge (`apps/web/src/styles/globals.css`) are unchanged. This workflow only migrates App Router consumer className literals to existing `@theme inline` utilities.

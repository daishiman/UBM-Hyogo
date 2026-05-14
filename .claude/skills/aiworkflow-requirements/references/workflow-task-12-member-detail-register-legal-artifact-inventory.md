# Workflow Artifact Inventory: task-12 member detail / register / legal

## Current Canonical Set

| Category | Path |
| --- | --- |
| workflow root | `docs/30-workflows/task-12-member-detail-register-legal/` |
| source spec | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/05-screens-public/task-12-w5-par-member-detail-register-legal.md` |
| root ledger | `docs/30-workflows/task-12-member-detail-register-legal/artifacts.json` |
| output mirror | `docs/30-workflows/task-12-member-detail-register-legal/outputs/artifacts.json` |
| Phase 12 compliance | `docs/30-workflows/task-12-member-detail-register-legal/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| implementation guide | `docs/30-workflows/task-12-member-detail-register-legal/outputs/phase-12/implementation-guide.md` |

## Runtime Boundary

State: `implemented-local / implementation / VISUAL_ON_EXECUTION / runtime evidence pending_user_approval`.

`apps/web` implementation is claimed in this inventory: public member detail, register, privacy, terms, public components, legal wrapper, focused unit tests, Playwright smoke spec, and Playwright evidence output routing. No `packages/` implementation changed. Full runtime screenshots / staging smoke / commit / push / PR remain user-gated.

## Upstream And Downstream

| Relationship | Path |
| --- | --- |
| depends on task-08 | `docs/30-workflows/task-08-w2-design-tokens-doc/` |
| depends on task-09 | `docs/30-workflows/task-09-w3-tailwind-v4-setup/` |
| depends on task-10 | `docs/30-workflows/completed-tasks/task-10-ui-primitives-spec/` |
| blocks task-18 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/06-regression/` |

## Evidence

Phase 11 runtime evidence is reserved under `outputs/phase-11/evidence/` and remains pending. Phase 12 strict evidence is present under `outputs/phase-12/`.

## Lessons Learned

苦戦箇所は `references/lessons-learned-task-12-member-detail-register-legal-2026-05.md` に L-TASK12-001〜005 として記録する。要点は Playwright evidence path 多重ルーティング (argv heuristic + `PLAYWRIGHT_EVIDENCE_TASK` env)、`webServer.env.PORT` を `PLAYWRIGHT_BASE_URL` から導出、legacy CSS `[data-component]` selector list join による重複 rule 防止、`.ui-card` primitive を `[data-component="register-callout"]` ancestor で scope、`responder-link` と `register-cta` の comma-join dual-role。

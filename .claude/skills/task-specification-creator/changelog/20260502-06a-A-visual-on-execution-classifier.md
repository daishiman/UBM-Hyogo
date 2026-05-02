# 2026-05-02 06a-A VISUAL_ON_EXECUTION classifier sync

Reflected `docs/30-workflows/06a-A-public-web-real-workers-d1-smoke-execution/outputs/phase-12/skill-feedback-report.md` into task-specification-creator.

- Extended the `classifyVisualEvidence` regex in `scripts/validate-phase-output.js` so `VISUAL_ON_EXECUTION` and `VISUAL_DEFERRED` are routed into the `non_visual` / `docs-only` / `spec_created` group, eliminating false positives on Phase 11 pre-execution screenshot completeness checks.
- Added a usage rule for `VISUAL_ON_EXECUTION` to `references/task-type-decision.md` so the classifier change has a documented contract on the spec side.
- Updated `SKILL.md` change history.

Boundary: docs + validator regex update. No production secrets, no Cloudflare mutations, no commit / push / PR.

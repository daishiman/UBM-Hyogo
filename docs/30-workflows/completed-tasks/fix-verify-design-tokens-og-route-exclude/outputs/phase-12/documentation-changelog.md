# Documentation Changelog

## 2026-05-23

- Reclassified `docs/30-workflows/completed-tasks/fix-verify-design-tokens-og-route-exclude/` from spec-only wording to `implemented-local / local-evidence-captured`.
- Synchronized Phase 2 with Phase 5/6: existing `scripts/verify-design-tokens.spec.ts` is the test target, and duplicate verifier filters are intentionally collapsed.
- Fixed Phase 11 TC-4 command ordering so `mkdir -p` runs before writing the canary route file.
- Added Phase 11 local evidence logs and Phase 12 strict output files.
- Added aiworkflow-requirements ledger, index, artifact inventory, and changelog entries.
- Corrected `artifacts.json` / `outputs/artifacts.json` Phase 1-7 statuses from stale `pending` values to `completed`.

# 2026-05-17 Issue #730 Phase 11 evidence existence validator

- Added Phase 11 evidence inventory parsing to the Phase 12 compliance verifier.
- Added `missing-evidence` as a compliance failure reason.
- `Status = present` rows now require a physical file under the workflow root.
- Absolute paths and workflow-root escape paths are rejected as missing evidence.
- Added fixtures and focused tests for present evidence, missing evidence, invalid status, empty path, directory path, numbered heading parsing, direct parser/existence checks, and path traversal.
- Promoted the rule to `references/phase-11-non-visual-alternative-evidence.md`.

`pnpm typecheck`, `pnpm lint`, `pnpm test:phase12-compliance`, and `pnpm verify:phase12-compliance` pass locally. Commit, push, PR, and Issue mutation remain user-gated.

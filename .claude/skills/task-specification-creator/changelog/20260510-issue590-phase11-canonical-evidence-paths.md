# 2026-05-10 Issue #590 Phase 11 Canonical Evidence Paths

- Added `schemas/phase11-evidence-canonical-paths.schema.json` for machine-readable Phase 11 evidence manifests.
- Added `scripts/validate-phase11-canonical-evidence-paths.js` with schema checks, duplicate id checks, safe relative path enforcement, and optional `--check-existence`.
- Added node:test coverage for valid manifests, missing required fields, enum violations, duplicate ids, additional properties, path traversal, missing `--workflow` arguments, missing evidence files, and present evidence files.
- Added skill-local `package.json` with `type: module` so ESM validator evidence logs do not include Node module-type warnings.
- Added root package script `validate:phase11-paths`.
- Parent Issue #549 now has `outputs/phase-11/canonical-paths.json` as the first applied manifest.

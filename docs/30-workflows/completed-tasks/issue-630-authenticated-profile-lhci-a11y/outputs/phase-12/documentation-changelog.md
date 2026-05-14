# Documentation Changelog

| File | Change |
| --- | --- |
| `index.md` | Reclassified Issue #630 as already CLOSED, changed refs policy to `Refs #630`, and synced state to `implemented-local-runtime-pending`. |
| `phase-01.md` | Added Phase 1 required metadata and corrected R-06. |
| `phase-04.md` | Synchronized `signSessionJwt` payload with actual shared API and noted missing `tsx` dependency. |
| `phase-07.md` | Removed unauthenticated `/api/me/profile` pre-check and corrected EXT-X1 / refs wording. |
| `phase-09.md` | Added `tsx` devDependency step and corrected EXT-X1 wording. |
| `phase-11.md` | Added authenticated final URL pre-check evidence row and mock API startup path. |
| `phase-12.md` | Clarified implemented-local/runtime-pending boundary, strict outputs, parity, and refs policy. |
| `phase-13.md` | Replaced the close keyword with `Refs #630`. |
| `artifacts.json`, `outputs/artifacts.json` | Added metadata required by task-specification-creator, root/output parity, and implemented-local-runtime-pending state. |
| `docs/30-workflows/e2e-quality-uplift/backlog.md` | Connected EXT-X1 to the #630 implemented-local-runtime-pending successor. |
| `docs/00-getting-started-manual/specs/02-auth.md` | Added LHCI test session JWT and mock API section. |
| `.github/workflows/lighthouse.yml` | Added authenticated `/profile` LHCI step, mock API ready check, and corrected artifact upload paths. |
| `apps/web/scripts/*`, `apps/web/lhci/lhci-auth.cjs`, `lighthouserc*.json` | Implemented authenticated profile LHCI storage, mock API, cookie injection, final URL pre-check, and config split. |
| `outputs/phase-11/evidence/{typecheck,lint,test}.log` | Captured local static evidence with exit 0. |
| `.claude/skills/aiworkflow-requirements/*` | Added discovery, active workflow, and changelog entries. |

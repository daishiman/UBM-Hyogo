# Manual Test Result

Status: `local_static_pass_runtime_visual_pending`.

## Executed

- `pnpm --filter @ubm-hyogo/web typecheck`: PASS.
- Focused Vitest for sync panels, schemas, proxy, reflection note, sidebar link, and form constant: PASS, 8 files / 53 tests.
- `pnpm --filter @ubm-hyogo/web lint`: PASS.
- Legacy endpoint grep gate: PASS.

## Not Completed

- Runtime screenshot capture is pending. The gated Playwright spec exists, but the local run was terminated after the Playwright process stayed running without screenshot output.
- No PNG file is marked present until it physically exists under `outputs/phase-11/screenshots/`.

## Result Matrix

| TC-ID | Result | Screenshot evidence |
|---|---|---|
| TC-A1 | pending runtime visual | `screenshots/a-backfill-panel.png` |
| TC-B1 | pending runtime visual | `screenshots/b-manual-resync-panel.png` |
| TC-C1 | pending runtime visual | `screenshots/c-members-reflection-note.png` |
| TC-C2 | pending runtime visual | `screenshots/c-profile-publish-state.png` |
| TC-D1 | pending runtime visual | `screenshots/d-admin-form-link.png` |

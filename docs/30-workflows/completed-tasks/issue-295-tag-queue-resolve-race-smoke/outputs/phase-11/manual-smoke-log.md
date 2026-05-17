# Manual Smoke Log

Status: `runtime_pending`.

Local command evidence:

- `bash scripts/smoke/__tests__/tag-queue-race.test.sh` passed.
- `pnpm smoke:test` passed.

Staging runtime evidence is not captured yet because fixture creation, admin session cookie use, and D1 before/after SQL are user/operator gated.

Pending files:

- `outputs/phase-11/<ISO-ts>/result.json`
- `outputs/phase-11/<ISO-ts>/side-effects.json`
- `outputs/phase-11/sql/before.txt`
- `outputs/phase-11/sql/after.txt`

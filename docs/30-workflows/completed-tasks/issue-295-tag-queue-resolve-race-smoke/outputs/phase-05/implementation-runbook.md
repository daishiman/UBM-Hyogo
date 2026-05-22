# Implementation Runbook

1. Add `scripts/smoke/tag-queue-race.mjs` with strict CLI validation, redaction, concurrent fetch, evidence writing, and optional side-effect analysis.
2. Add `scripts/smoke/__tests__/tag-queue-race.test.sh` for dry-run, HTTP analysis, side-effect pass/fail, usage error, and secret leak checks.
3. Add `scripts/smoke/README.md` with staging execution guidance.
4. Wire the focused test into `package.json` `smoke:test`.
5. Keep Phase 11 runtime evidence `runtime_pending` until operator credentials are used to capture staging `result.json`, `before.txt`, and `after.txt`.

## Verification

```bash
bash scripts/smoke/__tests__/tag-queue-race.test.sh
pnpm smoke:test
```

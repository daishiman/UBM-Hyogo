# Script Design

`scripts/smoke/tag-queue-race.mjs` is a no-dependency Node 24 ESM runner for Issue #295.

## Contract

- Executes concurrent `POST /admin/tags/queue/:queueId/resolve` calls through the deployed API.
- Redacts `--session-cookie` from stdout and evidence.
- Writes `result.json` under `outputs/phase-11/<ISO-ts>/`.
- Returns exit `0` only for a real pass, `1` for failed race or side-effect analysis, and `2` for usage / connectivity errors.

## AC-4 Side-Effect Analysis

The runner does not query D1 directly. Operator SQL evidence is converted into a summary JSON and passed via `--side-effect-input`:

```json
{
  "expected": { "memberTagsDelta": 1, "auditLogDelta": 1, "queueStatus": "resolved" },
  "actual": { "memberTagsDelta": 1, "auditLogDelta": 1, "queueStatus": "resolved" }
}
```

When this file is provided, mismatched deltas make the runner exit `1` even if HTTP race results pass.

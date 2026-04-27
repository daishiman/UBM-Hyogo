# D1 Contention Runbook Section

## Decision Flow

1. Check Cloudflare D1 SQL statement documentation for `journal_mode` support.
2. If persistent `PRAGMA journal_mode=WAL` is officially supported, run it first in staging and record output.
3. If unsupported, transaction-scoped, or ambiguous, do not change production journal mode.
4. Use runtime mitigations: retry/backoff for busy errors, short transactions, queue-based write serialization, and staging load tests.

## Safe Commands

```bash
wrangler d1 execute ubm-hyogo-db --env staging --command "PRAGMA journal_mode;"
```

The command above is read-only evidence gathering. Mutation commands require explicit approval in the runtime execution task.

## Prohibited From UT-02

- No production `PRAGMA journal_mode=WAL`.
- No `PRAGMA journal_mode=DELETE` rollback.
- No push, commit, or PR creation.

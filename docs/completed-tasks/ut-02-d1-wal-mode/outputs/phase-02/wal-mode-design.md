# WAL Mode Design

## Design Decision

Use a conditional decision flow:

1. Confirm Cloudflare D1 official support for persistent `journal_mode=WAL`.
2. If supported, document the exact Cloudflare-approved command and verification evidence.
3. If unsupported or transaction-scoped only, do not mutate production journal mode; use retry/backoff, shorter transactions, queue serialization, and staging load checks in downstream implementation tasks.

## `wrangler.toml` Guidance

`wrangler.toml` should define the D1 binding only. It must not imply that SQLite PRAGMA settings are persisted through TOML.

```toml
[[d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-db"
database_id = "<cloudflare-d1-database-id>"

# D1 write/read contention policy:
# Do not assume persistent PRAGMA journal_mode=WAL unless Cloudflare D1
# documents support for it. Runtime mitigation is handled in the runbook.
```

## Alternative Strategy Matrix

| Strategy | Use When | Owner |
| --- | --- | --- |
| D1 WAL PRAGMA | Only if official persistent support exists | 02-serial execution |
| Retry/backoff on `SQLITE_BUSY` | Default runtime mitigation | UT-09 |
| Queue synchronization job | Writes must be serialized | UT-09 |
| Short transactions/batch sizing | Large sync jobs increase lock duration | UT-09 |
| Read caching | Read volume causes repeated contention | Later optimization task |

# Phase 1 Requirements

## Conclusion

UT-02 is a docs-only task. Its primary requirement is not to force-enable WAL mode on Cloudflare D1, but to determine whether D1 officially supports persistent `journal_mode=WAL` configuration and to hand off a safe runbook decision to `docs/completed-tasks/02-serial-monorepo-runtime-foundation/`.

## Official-Support Gate

| Check | Result | Evidence |
| --- | --- | --- |
| D1 compatible PRAGMA list includes `journal_mode` | FAIL | Cloudflare D1 SQL statements list compatible PRAGMAs and do not include `journal_mode`. |
| D1 PRAGMA effects are persistent | FAIL | Cloudflare D1 documents PRAGMA statements as applying to the current transaction. |
| `wrangler.toml` can directly configure SQLite journal mode | FAIL | D1 binding config supports database binding metadata, not SQLite PRAGMA persistence. |

## 4 Conditions

| Condition | Judgment | Rationale |
| --- | --- | --- |
| Value | PASS | Documenting the decision prevents later runtime tasks from assuming unsupported D1 behavior. |
| Feasibility | PASS | Docs-only evidence and runbook guidance can be completed without production D1 mutation. |
| Consistency | PASS | WAL is treated as a conditional option, not a guaranteed setting. |
| Operability | PASS | Runtime execution is delegated to 02-serial/UT-09 with fallback strategies. |

## Acceptance Criteria

| AC | Revised Requirement |
| --- | --- |
| AC-1 | `wrangler.toml` D1 binding guidance records that PRAGMA cannot be persisted through TOML. |
| AC-2 | WAL is applied only if Cloudflare D1 officially supports persistent `journal_mode=WAL`; otherwise non-support evidence is recorded. |
| AC-3 | The 02-serial runbook receives a decision flow, not unconditional production mutation commands. |
| AC-4 | Local/staging/production differences are documented as verification risks. |
| AC-5 | 02-serial and downstream UT-09 consume the same conditional policy. |

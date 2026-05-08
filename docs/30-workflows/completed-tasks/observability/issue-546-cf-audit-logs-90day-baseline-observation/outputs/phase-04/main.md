# Phase 4 Output: Data Acquisition Contract

Status: `PASS`

## Contract Summary

| Source | Fields / Shape | Boundary |
| --- | --- | --- |
| GitHub Actions monitor runs | `databaseId`, `status`, `conclusion`, `createdAt`, `updatedAt`, `headSha`, `event`, `url` | read-only |
| GitHub Actions watchdog runs | `databaseId`, `status`, `conclusion`, `createdAt`, `updatedAt`, `event`, `url` | read-only |
| GitHub Issues | `number`, `title`, `state`, `labels`, `createdAt`, `closedAt`, `url` | read-only |
| D1 summary | aggregate `SELECT` only | no `raw_json`, no mutation |

## Handoff

Proceed to Phase 5 with the JSON and SQL shapes fixed.

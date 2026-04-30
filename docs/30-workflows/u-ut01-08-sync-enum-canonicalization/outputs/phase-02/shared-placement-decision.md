# Phase 2 Output: Shared Placement Decision

## Decision

Use both static TypeScript types and Zod runtime schemas in U-UT01-10.

| File | Responsibility | Implementing task |
| --- | --- | --- |
| `packages/shared/src/types/sync.ts` | Compile-time union types | U-UT01-10 |
| `packages/shared/src/zod/sync.ts` | Runtime validation schemas | U-UT01-10 |

## Type Shape

```ts
export type SyncStatus = "pending" | "in_progress" | "completed" | "failed" | "skipped";
export type SyncTriggerType = "manual" | "cron" | "backfill";
```

## Boundary

U-UT01-08 decides placement and value domain only. U-UT01-10 owns file creation, exports, type tests, Zod schemas, and downstream imports.

## Rationale

Types alone do not validate runtime payloads. Zod alone can drift from compile-time union use. The paired placement is the smallest structure that closes both gaps.

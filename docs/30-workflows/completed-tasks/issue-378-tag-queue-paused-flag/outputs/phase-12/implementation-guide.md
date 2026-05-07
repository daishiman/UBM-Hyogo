# Implementation Guide

## Summary

Issue #378 adds `TAG_QUEUE_PAUSED` as a non-secret Cloudflare variable that can pause Forms sync candidate enqueue into `tag_assignment_queue`.

## Runtime Contract

| Value | Result |
| --- | --- |
| unset | enqueue enabled |
| `"false"` | enqueue enabled |
| `"true"` | enqueue paused |
| any other value | enqueue enabled |

When paused, `enqueueTagCandidate` returns:

```ts
{ enqueued: false, reason: "paused" }
```

It does not call D1 before returning. The structured log code is `UBM-TAGQ-PAUSED` and the log context includes `reason: "paused"`.

## Files

| File | Purpose |
| --- | --- |
| `apps/api/src/env.ts` | Adds `TAG_QUEUE_PAUSED?: string` to Worker env type |
| `apps/api/wrangler.toml` | Sets default `"false"` in root, production, and staging vars |
| `apps/api/src/workflows/tagCandidateEnqueue.ts` | Adds `parsePaused`, `paused` result reason, and early guard |
| `apps/api/src/jobs/sync-forms-responses.ts` | Parses env once and passes boolean to candidate enqueue |
| `apps/api/src/workflows/tagCandidateEnqueue.test.ts` | Covers unset / false / true / strict parser cases and structured log |
| `docs/30-workflows/runbooks/tag-queue-pause.md` | Emergency pause and recovery runbook |

## Invariants

- #5 remains intact: D1 access stays in `apps/api`.
- #13 remains intact: this task does not write directly to `member_tags`; resolve remains the only tag assignment write path.
- Existing queue rows remain resolvable while candidate enqueue is paused.

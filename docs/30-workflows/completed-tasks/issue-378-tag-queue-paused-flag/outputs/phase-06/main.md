# Phase 06 — 実装サマリ / Implementation

## 実コード変更

| ファイル | 変更内容 |
| --- | --- |
| `apps/api/src/env.ts` | `Env` に `readonly TAG_QUEUE_PAUSED?: string;` を追加 |
| `apps/api/wrangler.toml` | `[vars]` / `[env.staging.vars]` / `[env.production.vars]` の 3 箇所に `TAG_QUEUE_PAUSED = "false"` |
| `apps/api/src/workflows/tagCandidateEnqueue.ts` | `parsePaused` export 追加。`enqueueTagCandidate(c, input, paused=false)` の冒頭で `paused === true` ならば `logWarn({ code: "UBM-TAGQ-PAUSED", ... })` の上で `{ enqueued: false, reason: "paused" }` を返す early return |
| `apps/api/src/jobs/sync-forms-responses.ts` | `parsePaused(env)` を sync 前に 1 度評価し、`enqueueTagCandidate(ctx, input, paused)` に伝播 |

## DoD（達成）

- D1 非アクセスで paused return できる（unit test で `prepare` spy が 0 回）。
- structured log code は `UBM-TAGQ-PAUSED`、context に `reason: "paused"`。
- 既存 enqueue 経路の挙動は paused=false で完全に保たれる（has_tags / has_pending_candidate / 冪等性）。

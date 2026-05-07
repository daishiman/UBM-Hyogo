# Phase 02 — 基本設計 / Basic Design

## 戦略

Cloudflare Workers の `[vars]` を使う非機密 operational flag として実装する。`wrangler secret` は使わない。
判定は `apps/api/src/workflows/tagCandidateEnqueue.ts` で行い、解釈ヘルパ `parsePaused(env)` を export する。
呼び出し側（`apps/api/src/jobs/sync-forms-responses.ts`）は env を 1 回 parse して boolean を `enqueueTagCandidate` の第 3 引数に渡す。

## レイヤ責務

| 層 | 役割 |
| --- | --- |
| `wrangler.toml` `[vars]` / `[env.staging.vars]` / `[env.production.vars]` | flag 値の正本（default `"false"`）|
| `apps/api/src/env.ts` `Env.TAG_QUEUE_PAUSED?: string` | 型と一対一対応 |
| `tagCandidateEnqueue.ts` `parsePaused` | 文字列 → boolean の strict 解釈 |
| `tagCandidateEnqueue.ts` `enqueueTagCandidate` | paused=true で D1 触らずに早期 return + structured log |
| `sync-forms-responses.ts` | env 解釈と enqueue 呼び出しの結線 |

## ログ仕様

`logWarn({ code: "UBM-TAGQ-PAUSED", message, context: { memberId, responseId, reason: "paused" }})`

## 不変条件マッピング

- #5: D1 アクセスは `enqueueTagCandidate` 内のみ（paused 経路は D1 prepare を呼ばない）。
- #13: 本タスクは `member_tags` に書き込まない（既存 resolve workflow が唯一の書き込み経路のまま）。

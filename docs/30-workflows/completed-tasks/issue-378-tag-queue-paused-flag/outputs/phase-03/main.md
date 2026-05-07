# Phase 03 — 詳細設計 / Detail Design

## 関数シグネチャ

```ts
// apps/api/src/workflows/tagCandidateEnqueue.ts
export function parsePaused(env: { readonly TAG_QUEUE_PAUSED?: string }): boolean;

export interface EnqueueTagCandidateResult {
  enqueued: boolean;
  reason?: "has_tags" | "has_pending_candidate" | "paused";
  queueId?: string;
}

export async function enqueueTagCandidate(
  c: DbCtx,
  input: EnqueueTagCandidateInput,
  paused?: boolean, // default false
): Promise<EnqueueTagCandidateResult>;
```

## 解釈表

| `TAG_QUEUE_PAUSED` 値 | `parsePaused` 戻り値 | enqueue 挙動 |
| --- | --- | --- |
| undefined | false | enqueue 通常実行 |
| `"false"` | false | enqueue 通常実行 |
| `"true"` | true | D1 触らず paused return + warn log |
| `"True"` / `"TRUE"` / `"1"` / `"yes"` 等 | false | enqueue 通常実行（strict） |

## 制御フロー

```
sync-forms-responses → parsePaused(env) → enqueueTagCandidate(ctx, input, paused)
  ├─ paused === true → logWarn(UBM-TAGQ-PAUSED) → return { enqueued: false, reason: "paused" }
  └─ paused === false → 既存ロジック（has_tags / has_pending_candidate / createIdempotent）
```

## wrangler.toml 配置

`[vars]` / `[env.staging.vars]` / `[env.production.vars]` の 3 セクションに `TAG_QUEUE_PAUSED = "false"` を配置。
production 切替は同 file の該当セクション編集 → `bash scripts/cf.sh deploy --env production` のみで完結する。

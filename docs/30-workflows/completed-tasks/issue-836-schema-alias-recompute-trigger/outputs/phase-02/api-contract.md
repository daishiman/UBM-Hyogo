# API contract 設計 — recompute endpoints

対象: `apps/api/src/routes/admin/schema.ts`（rollback endpoint `376-434` の隣に追加）。
不変条件: 既存 resolve / rollback / backfill endpoint は touch しない（path-namespace 分離）。

## 1. POST /admin/schema/aliases/:aliasId/recompute

rollback 済み alias の `response_fields` を reverse-backfill する recompute job を作成・実行する（admin 明示操作）。

### Request

- path param: `aliasId`（必須）
- header: 認証は既存 admin middleware 経由（`c.get("authUser")`）。`If-Match` は不要（recompute は alias version を変更しないため）。
- body（zod `RecomputeBodyZ`）:

```ts
const RecomputeBodyZ = z.object({
  reason: z.string().max(500).optional(),
});
```

`triggerKey` は client から受け取らない。workflow が `relatedRollbackAuditId ?? ${alias.id}:${alias.version}` から server-side に導出する。これにより client が任意 key で job UNIQUE を回避する余地を閉じる。

### Response 200（成功 / 既存 completed の冪等返却）

```ts
interface RecomputeResult {
  jobId: string;
  aliasId: string;
  status: "completed" | "running"; // 同期処理。CPU budget 内完了で completed、継続中は running
  affectedCount: number;           // job 作成時に検出した recompute 対象件数
  processedCount: number;          // processed response_id 件数（UPDATE + collision DELETE の合算）
  updatedCount: number;            // stableKey -> __extra__ に UPDATE した件数
  deletedCollisionCount: number;   // __extra__ 既存衝突により stableKey 行を DELETE した件数
  recomputeAuditId: string;        // job 初回実行時の schema_alias.recompute audit_id。completed 冪等返却時も同じ id を返す
  relatedRollbackAuditId: string | null; // 元 rollback の audit_id
}
```

### Error

| status | error code | 条件 |
| --- | --- | --- |
| 400 | `bad_request` | aliasId 欠如 / body parse 失敗 |
| 404 | `not_found` | alias が存在しない（soft-deleted 含めて不在） |
| 409 | `not_rolled_back` | alias がまだ rollback されていない（`deleted_at IS NULL`）。recompute は rollback 後のみ |
| 500 | `batch_failed` | D1 batch / UPDATE 失敗。job は `failed` に記録 |

> 設計判断: recompute は rollback 済み alias のみを対象とする（AC 整合）。`deleted_at IS NULL` の alias に対しては `409 not_rolled_back` を返し、誤操作を防ぐ。

## 2. GET /admin/schema/aliases/:aliasId/recompute

直近の recompute job status を取得する（UI の status バッジ表示・poll 用）。

### Request

- path param: `aliasId`（必須）

### Response 200

```ts
interface RecomputeStatusResult {
  jobId: string;
  aliasId: string;
  status: "pending" | "running" | "completed" | "failed";
  affectedCount: number;
  processedCount: number;
  updatedCount: number;
  deletedCollisionCount: number;
  lastError: string | null;
  updatedAt: string;
}
```

job が存在しない場合: `200` で `null`（body は `null`）。

## endpoint 実装スケッチ（schema.ts への追加）

```ts
// Issue #836: POST /admin/schema/aliases/:aliasId/recompute
app.post("/schema/aliases/:aliasId/recompute", async (c) => {
  const aliasId = c.req.param("aliasId");
  if (!aliasId) return c.json({ error: "bad_request", message: "aliasId required" }, 400);
  let raw: unknown = {};
  try { raw = await c.req.json(); } catch { raw = {}; }
  const parsed = RecomputeBodyZ.safeParse(raw);
  if (!parsed.success) return c.json({ error: "bad_request", message: parsed.error.message }, 400);
  const authUser = c.get("authUser");
  const actor = authUser?.email ?? "unknown";
  const db = ctx({ DB: c.env.DB });
  try {
    const result = await schemaAliasRecompute(db, {
      aliasId,
      actor,
      reason: parsed.data.reason ?? null,
    });
    return c.json(result, 200);
  } catch (err) {
    if (err instanceof SchemaAliasRecomputeFailure) {
      const status =
        err.kind === "not_found" ? 404 :
        err.kind === "not_rolled_back" ? 409 : 500;
      return c.json({ error: err.kind, message: err.message }, status);
    }
    throw err;
  }
});

// Issue #836: GET /admin/schema/aliases/:aliasId/recompute
app.get("/schema/aliases/:aliasId/recompute", async (c) => {
  const aliasId = c.req.param("aliasId");
  const db = ctx({ DB: c.env.DB });
  const job = await getLatestJobByAlias(db, aliasId);
  return c.json(job ?? null, 200);
});
```

## web helper 契約（apps/web/src/lib/admin/api.ts）

```ts
export interface RecomputeSchemaAliasInput {
  aliasId: string;
  reason?: string;
}
export interface RecomputeSchemaAliasResult {
  jobId: string;
  aliasId: string;
  status: "completed" | "running";
  affectedCount: number;
  processedCount: number;
  updatedCount: number;
  deletedCollisionCount: number;
  recomputeAuditId: string;
  relatedRollbackAuditId: string | null;
}
export interface RecomputeStatusResult {
  jobId: string;
  aliasId: string;
  status: "pending" | "running" | "completed" | "failed";
  affectedCount: number;
  processedCount: number;
  updatedCount: number;
  deletedCollisionCount: number;
  lastError: string | null;
  updatedAt: string;
}
export class RecomputeApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message?: string) {
    super(message ?? `${code} (status ${status})`);
    this.status = status; this.code = code; this.name = "RecomputeApiError";
  }
}
export async function recomputeSchemaAlias(input: RecomputeSchemaAliasInput): Promise<RecomputeSchemaAliasResult>;
export async function getSchemaAliasRecomputeStatus(aliasId: string): Promise<RecomputeStatusResult | null>;
```

- `recomputeSchemaAlias`: `POST /api/admin/schema/aliases/{aliasId}/recompute`、body `{ reason }`、`RollbackApiError` と同パターンの error 解釈。`triggerKey` は server-side derivation 固定で client から送らない。
- `getSchemaAliasRecomputeStatus`: `GET /api/admin/schema/aliases/{aliasId}/recompute`、body が `null` の場合は `null` を返す。

## AC トレース

| AC | 担保箇所 |
| --- | --- |
| AC-1 | POST endpoint + workflow reverse-backfill |
| AC-3 | response `recomputeAuditId` / `relatedRollbackAuditId` |
| AC-4 | GET endpoint + `RecomputeStatusResult` |
| AC-5 | recompute は admin actor の POST のみ。rollback workflow は呼ばない |
| AC-9 | web helper は useAdminMutation から呼ぶ（UI 設計） |
| AC-12 | web → API fetch のみ。D1 直接アクセスなし |

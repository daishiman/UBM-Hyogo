# Phase 5 — 実装ランブック

## 実装順序

1. `routes/admin/dashboard.ts`（read のみ、最も単純）
2. `routes/admin/members.ts`（list + detail）
3. `routes/admin/member-status.ts`（PATCH status）
4. `routes/admin/member-notes.ts`（POST/PATCH notes）
5. `routes/admin/member-delete.ts`（POST delete + restore）
6. `routes/admin/tags-queue.ts`（GET + resolve）
7. `routes/admin/schema.ts`（GET diff + POST aliases）
8. `routes/admin/meetings.ts`（GET + POST）
9. `routes/admin/attendance.ts`（POST + DELETE）
10. `index.ts` への結線（全 router を `app.route("/admin", xxx)` で mount）
11. テスト追加 → `mise exec -- pnpm typecheck` → `pnpm --filter @ubm-hyogo/api test`

## 共通 pseudocode

```ts
// routes/admin/<resource>.ts
import { Hono } from "hono";
import { z } from "zod";
import { adminGate, type AdminGateEnv } from "../../middleware/admin-gate";
import { ctx } from "../../repository/_shared/db";
import * as auditLog from "../../repository/auditLog";

interface Env extends AdminGateEnv { readonly DB: D1Database }

export const createXxxRoute = () => {
  const app = new Hono<{ Bindings: Env }>();
  app.use("*", adminGate);

  app.get("/path", async (c) => {
    const view = await buildView(ctx({ DB: c.env.DB }));
    return c.json(XxxViewZ.parse(view));
  });

  app.post("/path", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = InputZ.safeParse(body);
    if (!parsed.success) return c.json({ ok:false, error:"invalid_input" }, 400);
    const result = await mutate(ctx({ DB: c.env.DB }), parsed.data);
    await auditLog.append(ctx({ DB: c.env.DB }), {
      actorId: null, actorEmail: null,
      action: ("admin." + verb) as any,
      targetType, targetId,
      before: null, after: result,
    });
    return c.json(result, 200);
  });

  return app;
};
export const xxxRoute = createXxxRoute();
```

## index.ts 結線（追加分）

```ts
app.route("/admin", dashboardRoute);
app.route("/admin", membersRoute);
app.route("/admin", memberStatusRoute);
app.route("/admin", memberNotesRoute);
app.route("/admin", memberDeleteRoute);
app.route("/admin", tagsQueueRoute);
app.route("/admin", schemaRoute);
app.route("/admin", meetingsRoute);
app.route("/admin", attendanceRoute);
```

## attendance status マッピング

```ts
const r = await addAttendance(ctx, memberId, sessionId, by);
if (r.ok) return c.json({ sessionId, memberId }, 201);
if (r.reason === "duplicate") return c.json({ ok:false, error:"duplicate" }, 409);
if (r.reason === "deleted_member") return c.json({ ok:false, error:"deleted_member" }, 422);
if (r.reason === "session_not_found") return c.json({ ok:false, error:"not_found" }, 404);
```

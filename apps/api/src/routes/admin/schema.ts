// 04c: GET /admin/schema/diff, POST /admin/schema/aliases
// 不変条件 #14: schema 変更は /admin/schema/* のみ。
import { Hono } from "hono";
import { z } from "zod";
import { requireAdmin } from "../../middleware/require-admin";
import { ctx } from "../../repository/_shared/db";
import { asStableKey, auditAction } from "../../repository/_shared/brand";
import {
  list as listDiffs,
  findById as findDiffById,
  resolve as resolveDiff,
} from "../../repository/schemaDiffQueue";
import {
  updateStableKey,
  findStableKeyByQuestionId,
} from "../../repository/schemaQuestions";
import { append as auditAppend } from "../../repository/auditLog";
import type { AdminRouteEnv } from "./_shared";

const AliasBodyZ = z.object({
  diffId: z.string().min(1).optional(),
  questionId: z.string().min(1),
  stableKey: z.string().min(1),
});

export const createAdminSchemaRoute = () => {
  const app = new Hono<{ Bindings: AdminRouteEnv }>();
  app.use("*", requireAdmin);

  app.get("/schema/diff", async (c) => {
    const db = ctx({ DB: c.env.DB });
    const items = await listDiffs(db);
    return c.json({ total: items.length, items }, 200);
  });

  app.post("/schema/aliases", async (c) => {
    let raw: unknown;
    try {
      raw = await c.req.json();
    } catch {
      return c.json({ ok: false, error: "invalid json" }, 400);
    }
    const parsed = AliasBodyZ.safeParse(raw);
    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.message }, 400);
    }
    const db = ctx({ DB: c.env.DB });
    const before = await findStableKeyByQuestionId(db, parsed.data.questionId);
    if (before === null) {
      const questionExists = await db.db
        .prepare("SELECT 1 AS found FROM schema_questions WHERE question_id = ?1 LIMIT 1")
        .bind(parsed.data.questionId)
        .first<{ found: number }>();
      if (!questionExists) {
        return c.json({ ok: false, error: "question not found" }, 404);
      }
    }
    if (parsed.data.diffId) {
      const diff = await findDiffById(db, parsed.data.diffId);
      if (!diff) return c.json({ ok: false, error: "diff not found" }, 404);
      if (diff.questionId !== parsed.data.questionId) {
        return c.json({ ok: false, error: "diff question mismatch" }, 409);
      }
    }
    await updateStableKey(
      db,
      parsed.data.questionId,
      asStableKey(parsed.data.stableKey),
    );
    if (parsed.data.diffId) {
      await resolveDiff(db, parsed.data.diffId, "system");
    }
    await auditAppend(db, {
      actorId: null,
      actorEmail: null,
      action: auditAction("admin.schema.alias_assigned"),
      targetType: "schema_diff",
      targetId: parsed.data.diffId ?? parsed.data.questionId,
      before: { stableKey: before },
      after: { stableKey: parsed.data.stableKey, questionId: parsed.data.questionId },
    });
    return c.json({ ok: true }, 200);
  });

  return app;
};

export const adminSchemaRoute = createAdminSchemaRoute();

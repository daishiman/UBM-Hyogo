// 04c + 07b: GET /admin/schema/diff, POST /admin/schema/aliases
// 不変条件 #14: schema 変更は /admin/schema/* のみ。
// 07b 拡張: dryRun query, recommendedStableKeys 同梱, collision 422, idempotent
import { Hono } from "hono";
import { z } from "zod";
import { requireAdmin, type RequireAuthVariables } from "../../middleware/require-admin";
import { ctx } from "../../repository/_shared/db";
import { adminEmail, asAdminId } from "../../repository/_shared/brand";
import type { AdminEmail, AdminId } from "../../repository/_shared/brand";
import { list as listDiffs } from "../../repository/schemaDiffQueue";
import {
  recommendAliases,
  type RecommendExistingInput,
} from "../../services/aliasRecommendation";
import {
  schemaAliasAssign,
  SchemaAliasAssignFailure,
} from "../../workflows/schemaAliasAssign";
import type { AdminRouteEnv } from "./_shared";

const AliasBodyZ = z.object({
  diffId: z.string().min(1).optional(),
  questionId: z.string().min(1),
  stableKey: z
    .string()
    .min(1)
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "stableKey must match /^[a-zA-Z][a-zA-Z0-9_]*$/"),
});

interface ExistingQuestionRow {
  stable_key: string;
  label: string;
  section_key: string;
  position: number;
}

interface DiffEnrichmentInput {
  questionId: string | null;
  label: string;
}

const buildRecommendations = async (
  db: AdminRouteEnv["DB"],
  diffs: ReadonlyArray<DiffEnrichmentInput>,
): Promise<Map<string, string[]>> => {
  if (diffs.length === 0) return new Map();
  const r = await db
    .prepare(
      "SELECT stable_key, label, section_key, position FROM schema_questions WHERE stable_key != 'unknown'",
    )
    .all<ExistingQuestionRow>();
  const existing: RecommendExistingInput[] = (r.results ?? []).map((row) => ({
    stableKey: row.stable_key,
    label: row.label,
    sectionKey: row.section_key,
    position: row.position,
  }));
  const out = new Map<string, string[]>();
  for (const d of diffs) {
    if (!d.questionId) continue;
    // diff の section_key / position は queue にないので、現行 schema_questions から引く
    let sectionKey: string | null = null;
    let position: number | null = null;
    const detail = await db
      .prepare(
        "SELECT section_key, position FROM schema_questions WHERE question_id = ? ORDER BY revision_id DESC LIMIT 1",
      )
      .bind(d.questionId)
      .first<{ section_key: string; position: number }>();
    if (detail) {
      sectionKey = detail.section_key;
      position = detail.position;
    }
    out.set(
      d.questionId,
      recommendAliases({ label: d.label, sectionKey, position }, existing, 5),
    );
  }
  return out;
};

const failureToHttp = (
  err: SchemaAliasAssignFailure,
): { status: 400 | 404 | 409 | 422; body: Record<string, unknown> } => {
  switch (err.detail.kind) {
    case "question_not_found":
      return { status: 404, body: { ok: false, error: "question not found" } };
    case "diff_not_found":
      return { status: 404, body: { ok: false, error: "diff not found" } };
    case "diff_question_mismatch":
      return {
        status: 409,
        body: { ok: false, error: "diff question mismatch" },
      };
    case "collision":
      return {
        status: 422,
        body: {
          ok: false,
          error: "stableKey collision",
          existingQuestionIds: err.detail.existingQuestionIds,
        },
      };
  }
};

export const createAdminSchemaRoute = () => {
  const app = new Hono<{ Bindings: AdminRouteEnv; Variables: RequireAuthVariables }>();
  app.use("*", requireAdmin);

  app.get("/schema/diff", async (c) => {
    const db = ctx({ DB: c.env.DB });
    const items = await listDiffs(db);
    const recommendations = await buildRecommendations(c.env.DB, items);
    const enriched = items.map((it) => ({
      ...it,
      recommendedStableKeys: it.questionId
        ? (recommendations.get(it.questionId) ?? [])
        : [],
    }));
    return c.json({ total: enriched.length, items: enriched }, 200);
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
    const dryRun = c.req.query("dryRun") === "true";
    const db = ctx({ DB: c.env.DB });

    const authUser = c.get("authUser");
    const actorId: AdminId | null = authUser?.memberId
      ? asAdminId(authUser.memberId as unknown as string)
      : null;
    const actorEmail: AdminEmail | null = authUser?.email
      ? adminEmail(authUser.email)
      : null;

    try {
      const result = await schemaAliasAssign(db, {
        questionId: parsed.data.questionId,
        stableKey: parsed.data.stableKey,
        ...(parsed.data.diffId ? { diffId: parsed.data.diffId } : {}),
        dryRun,
        actorId,
        actorEmail,
      });
      return c.json({ ok: true, ...result }, 200);
    } catch (err) {
      if (err instanceof SchemaAliasAssignFailure) {
        const { status, body } = failureToHttp(err);
        return c.json(body, status);
      }
      throw err;
    }
  });

  return app;
};

export const adminSchemaRoute = createAdminSchemaRoute();

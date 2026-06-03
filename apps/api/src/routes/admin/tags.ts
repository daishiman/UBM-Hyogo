import { Hono, type Context } from "hono";
import { z } from "zod";
import { requireAdmin, type RequireAuthVariables } from "../../middleware/require-admin";
import {
  writeTagNoteProviderMiddleware,
  type WriteTagNoteProviderVariables,
} from "../../middleware/repository-providers";
import { adminEmail, asAdminId, auditAction } from "../../repository/_shared/brand";
import { ctx, type DbCtx } from "../../repository/_shared/db";
import { requireProvider } from "../../repository/_shared/provider-context";
import {
  createTagDefinition,
  deactivateTagDefinition,
  getTagDefinitionByIdRaw,
  listTagDefinitionsPaged,
  physicalDeleteTagDefinition,
  reactivateTagDefinition,
  updateTagDefinition,
  type TagDefinitionRow,
} from "../../repository/tagDefinitions";
import type { AdminRouteEnv } from "./_shared";

const CODE_RE = /^[a-z0-9][a-z0-9_]*$/;

const CreateTagBodyZ = z.object({
  code: z.string().min(1).max(64).regex(CODE_RE),
  label: z.string().min(1).max(120),
  category: z.string().min(1).max(64),
});

const UpdateTagBodyZ = z
  .object({
    label: z.string().min(1).max(120).optional(),
    category: z.string().min(1).max(64).optional(),
  })
  .refine((body) => body.label !== undefined || body.category !== undefined, {
    message: "no_update_fields",
  });

const ListTagsQueryZ = z.object({
  q: z.string().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

const ERROR_TO_STATUS = {
  invalid_query: 400,
  invalid_json: 400,
  invalid_body: 400,
  no_update_fields: 400,
  tag_not_found: 404,
  tag_code_conflict: 409,
  tag_has_references: 409,
} as const;

type ErrorCode = keyof typeof ERROR_TO_STATUS;
type AdminTagsContext = Context<{
  Bindings: AdminRouteEnv;
  Variables: RequireAuthVariables & Partial<WriteTagNoteProviderVariables> & { ctx?: DbCtx };
}>;

const fail = (c: AdminTagsContext, code: ErrorCode) =>
  c.json({ ok: false, error: code }, ERROR_TO_STATUS[code]);

const failWithBody = (
  c: AdminTagsContext,
  code: ErrorCode,
  body: Record<string, unknown>,
) => c.json({ ok: false, error: code, ...body }, ERROR_TO_STATUS[code]);

const rowBody = (row: TagDefinitionRow) => ({
  tagId: row.tagId,
  code: row.code,
  label: row.label,
  category: row.category,
  active: row.active,
});

const samePatchValues = (
  before: TagDefinitionRow,
  after: TagDefinitionRow,
  input: { label?: string; category?: string },
) =>
  (input.label === undefined || before.label === after.label) &&
  (input.category === undefined || before.category === after.category);

export const createAdminTagsRoute = () => {
  const app = new Hono<{
    Bindings: AdminRouteEnv;
    Variables: RequireAuthVariables & Partial<WriteTagNoteProviderVariables> & { ctx?: DbCtx };
  }>();

  app.use("*", requireAdmin);
  app.use("*", writeTagNoteProviderMiddleware);

  const db = (c: AdminTagsContext) => c.get("ctx") ?? ctx({ DB: c.env.DB });

  const appendTagAudit = async (
    c: AdminTagsContext,
    input: {
      action:
        | "admin.tag.created"
        | "admin.tag.updated"
        | "admin.tag.deactivated"
        | "admin.tag.reactivated"
        | "admin.tag.physically_deleted";
      targetId: string;
      before: Record<string, unknown> | null;
      after: Record<string, unknown> | null;
    },
  ) => {
    const authUser = c.get("authUser");
    await requireProvider(c.var.auditLogProvider, "auditLogProvider").append({
      actorId: asAdminId(authUser.memberId),
      actorEmail: adminEmail(authUser.email),
      action: auditAction(input.action),
      targetType: "tag",
      targetId: input.targetId,
      before: input.before,
      after: input.after,
    });
  };

  app.get("/tags", async (c) => {
    const parsed = ListTagsQueryZ.safeParse({
      q: c.req.query("q"),
      page: c.req.query("page"),
      pageSize: c.req.query("pageSize"),
    });
    if (!parsed.success) return fail(c, "invalid_query");

    const listOpts: { q?: string; page: number; pageSize: number } = {
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
    };
    if (parsed.data.q !== undefined) listOpts.q = parsed.data.q;

    const result = await listTagDefinitionsPaged(db(c), listOpts);
    return c.json(
      { total: result.total, items: result.items.map(rowBody) },
      200,
    );
  });

  app.post("/tags", async (c) => {
    let raw: unknown;
    try {
      raw = await c.req.json();
    } catch {
      return fail(c, "invalid_json");
    }
    const parsed = CreateTagBodyZ.safeParse(raw);
    if (!parsed.success) return fail(c, "invalid_body");

    const result = await createTagDefinition(db(c), parsed.data);
    if (!result.ok) return fail(c, "tag_code_conflict");

    await appendTagAudit(c, {
      action: "admin.tag.created",
      targetId: result.row.tagId,
      before: null,
      after: {
        code: result.row.code,
        label: result.row.label,
        category: result.row.category,
      },
    });
    return c.json(rowBody(result.row), 201);
  });

  app.patch("/tags/:tagId", async (c) => {
    let raw: unknown;
    try {
      raw = await c.req.json();
    } catch {
      return fail(c, "invalid_json");
    }
    const parsed = UpdateTagBodyZ.safeParse(raw);
    if (!parsed.success) return fail(c, "no_update_fields");

    const tagId = c.req.param("tagId");
    const patchInput: { label?: string; category?: string } = {};
    if (parsed.data.label !== undefined) patchInput.label = parsed.data.label;
    if (parsed.data.category !== undefined) patchInput.category = parsed.data.category;

    const before = await getTagDefinitionByIdRaw(db(c), tagId);
    if (!before) return fail(c, "tag_not_found");

    const after = await updateTagDefinition(db(c), tagId, patchInput);
    if (!after) return fail(c, "tag_not_found");

    if (!samePatchValues(before, after, patchInput)) {
      await appendTagAudit(c, {
        action: "admin.tag.updated",
        targetId: tagId,
        before: { label: before.label, category: before.category },
        after: { label: after.label, category: after.category },
      });
    }
    return c.json(rowBody(after), 200);
  });

  app.delete("/tags/:tagId", async (c) => {
    const tagId = c.req.param("tagId");
    const result = await deactivateTagDefinition(db(c), tagId);
    if (!result) return fail(c, "tag_not_found");

    if (result.changed) {
      await appendTagAudit(c, {
        action: "admin.tag.deactivated",
        targetId: tagId,
        before: { active: true },
        after: { active: false },
      });
    }
    return c.body(null, 204);
  });

  app.post("/tags/:tagId/reactivate", async (c) => {
    const tagId = c.req.param("tagId");
    const result = await reactivateTagDefinition(db(c), tagId);
    if (!result) return fail(c, "tag_not_found");

    if (result.changed) {
      await appendTagAudit(c, {
        action: "admin.tag.reactivated",
        targetId: tagId,
        before: { active: false },
        after: { active: true },
      });
    }
    return c.json(rowBody(result.row), 200);
  });

  app.delete("/tags/:tagId/physical", async (c) => {
    const tagId = c.req.param("tagId");
    const result = await physicalDeleteTagDefinition(db(c), tagId);
    if (!result.ok) {
      if (result.reason === "not_found") return fail(c, "tag_not_found");
      return failWithBody(c, "tag_has_references", {
        referenceCount: result.referenceCount,
      });
    }

    await appendTagAudit(c, {
      action: "admin.tag.physically_deleted",
      targetId: tagId,
      before: rowBody(result.row),
      after: null,
    });
    return c.body(null, 204);
  });

  return app;
};

export const adminTagsRoute = createAdminTagsRoute();

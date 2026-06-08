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
import { detectOrphanMemberTags } from "../../repository/memberTags";
import {
  createTagDefinition,
  deactivateTagDefinition,
  forceMigrateAndPhysicalDeleteTagDefinition,
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
    code: z.string().min(1).max(64).regex(CODE_RE).optional(),
    label: z.string().min(1).max(120).optional(),
    category: z.string().min(1).max(64).optional(),
    expectedCode: z.string().min(1).max(64).regex(CODE_RE).optional(),
  })
  .refine((body) => body.code !== undefined || body.label !== undefined || body.category !== undefined, {
    message: "no_update_fields",
  })
  .refine((body) => body.code === undefined || body.expectedCode !== undefined, {
    message: "expected_code_required",
    path: ["expectedCode"],
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
  tag_stale_conflict: 409,
  migration_target_not_found: 404,
  migration_target_inactive: 409,
  migration_target_same_as_source: 400,
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
  input: { code?: string; label?: string; category?: string },
) =>
  (input.code === undefined || before.code === after.code) &&
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
        | "admin.tag.physically_deleted"
        | "admin.tag.references_migrated"
        | "admin.tag.code_renamed";
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

  // 静的セグメント /tags/orphans は /tags/:tagId 系より前に登録し、capture を防ぐ。
  // read-only ゆえ audit log なし（既存 read endpoint に倣う）。
  app.get("/tags/orphans", async (c) => {
    const orphans = await detectOrphanMemberTags(db(c));
    return c.json({ ok: true, count: orphans.length, orphans });
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
    if (!parsed.success) {
      const isNoUpdateFields = parsed.error.issues.some(
        (issue) => issue.message === "no_update_fields",
      );
      return fail(c, isNoUpdateFields ? "no_update_fields" : "invalid_body");
    }

    const tagId = c.req.param("tagId");
    const patchInput: { code?: string; label?: string; category?: string; expectedCode?: string } = {};
    if (parsed.data.code !== undefined) patchInput.code = parsed.data.code;
    if (parsed.data.label !== undefined) patchInput.label = parsed.data.label;
    if (parsed.data.category !== undefined) patchInput.category = parsed.data.category;
    if (parsed.data.expectedCode !== undefined) patchInput.expectedCode = parsed.data.expectedCode;

    const before = await getTagDefinitionByIdRaw(db(c), tagId);
    if (!before) return fail(c, "tag_not_found");

    const result = await updateTagDefinition(db(c), tagId, patchInput);
    if (!result.ok) {
      if (result.reason === "code_conflict") return fail(c, "tag_code_conflict");
      if (result.reason === "stale") return fail(c, "tag_stale_conflict");
      if (result.reason === "missing_expected_code") return fail(c, "invalid_body");
      return fail(c, "tag_not_found");
    }
    const after = result.row;

    if (!samePatchValues(before, after, patchInput)) {
      if (before.code !== after.code) {
        await appendTagAudit(c, {
          action: "admin.tag.code_renamed",
          targetId: tagId,
          before: { code: before.code },
          after: { code: after.code },
        });
      }
      if (before.label !== after.label || before.category !== after.category) {
        await appendTagAudit(c, {
          action: "admin.tag.updated",
          targetId: tagId,
          before: { label: before.label, category: before.category },
          after: { label: after.label, category: after.category },
        });
      }
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
    const rawMigrateTo = c.req.query("migrateTo");
    const migrateTo = rawMigrateTo?.trim();
    if (rawMigrateTo !== undefined && migrateTo?.length === 0) {
      return fail(c, "migration_target_not_found");
    }
    if (migrateTo !== undefined) {
      const result = await forceMigrateAndPhysicalDeleteTagDefinition(db(c), tagId, migrateTo);
      if (!result.ok) {
        if (result.reason === "not_found") return fail(c, "tag_not_found");
        if (result.reason === "target_not_found") return fail(c, "migration_target_not_found");
        if (result.reason === "target_inactive") return fail(c, "migration_target_inactive");
        if (result.reason === "same_as_source") return fail(c, "migration_target_same_as_source");
        return failWithBody(c, "tag_has_references", {
          referenceCount: result.referenceCount,
        });
      }

      await appendTagAudit(c, {
        action: "admin.tag.references_migrated",
        targetId: tagId,
        before: {
          tag_id: tagId,
          dest: migrateTo,
          referenceCount: result.sourceReferenceCount,
        },
        after: {
          migratedCount: result.migratedCount,
          deleted: true,
        },
      });
      await appendTagAudit(c, {
        action: "admin.tag.physically_deleted",
        targetId: tagId,
        before: rowBody(result.row),
        after: null,
      });
      return c.body(null, 204);
    }

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

import { Hono } from "hono";
import { z } from "zod";
import { STABLE_KEY_LIST, asMemberId, asStableKey } from "@ubm-hyogo/shared";
import { requireAdmin, type RequireAuthVariables } from "../../middleware/require-admin";
import { ctx } from "../../repository/_shared/db";
import { findMemberById } from "../../repository/members";
import { findCurrentResponse } from "../../repository/responses";
import { listFieldsByResponseId } from "../../repository/responseFields";
import {
  listFieldOverridesByMemberId,
  upsertMemberFieldOverride,
} from "../../repository/memberFieldOverrides";
import { resolveFieldPrecedence } from "../../use-cases/_shared/field-precedence";
import type { AdminRouteEnv } from "./_shared";

const FieldPatchZ = z.object({
  stableKey: z.enum(STABLE_KEY_LIST as [string, ...string[]]),
  value: z.union([z.string(), z.array(z.string()), z.number(), z.boolean(), z.null()]),
});

const BodyZ = z.union([
  FieldPatchZ,
  z.object({
    fields: z.array(FieldPatchZ).min(1),
  }),
]);

const parseJson = (value: string | null): unknown => {
  if (value === null) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export const adminMemberFieldsRoute = new Hono<{
  Bindings: AdminRouteEnv;
  Variables: RequireAuthVariables;
}>();

adminMemberFieldsRoute.use("*", requireAdmin);

adminMemberFieldsRoute.get("/member-fields/:memberId", async (c) => {
  const memberId = c.req.param("memberId");
  const db = ctx({ DB: c.env.DB });
  const mid = asMemberId(memberId);
  const exists = await findMemberById(db, mid);
  if (!exists) return c.json({ ok: false, error: "member_not_found" }, 404);

  const response = await findCurrentResponse(db, mid);
  const [fields, overrides] = await Promise.all([
    response ? listFieldsByResponseId(db, response.response_id as never) : Promise.resolve([]),
    listFieldOverridesByMemberId(db, mid),
  ]);
  const responseByKey = new Map(fields.map((field) => [field.stable_key, field]));
  const overrideByKey = new Map(overrides.map((field) => [field.stable_key, field]));

  return c.json(
    {
      ok: true,
      memberId,
      fields: resolveFieldPrecedence(fields, overrides).map((field) => {
        const responseField = responseByKey.get(field.stable_key);
        const override = overrideByKey.get(field.stable_key);
        return {
          stableKey: field.stable_key,
          responseValue: parseJson(responseField?.value_json ?? null),
          overrideValue: override ? parseJson(override.value_json) : null,
          effectiveValue: parseJson(field.value_json),
          source: field.source,
          updatedBy: override?.updated_by ?? null,
          updatedAt: override?.updated_at ?? null,
        };
      }),
    },
    200,
  );
});

adminMemberFieldsRoute.put("/member-fields/:memberId", async (c) => {
  const memberId = c.req.param("memberId");
  const parsed = BodyZ.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ ok: false, error: "invalid_body" }, 400);

  const db = ctx({ DB: c.env.DB });
  const mid = asMemberId(memberId);
  const exists = await findMemberById(db, mid);
  if (!exists) return c.json({ ok: false, error: "member_not_found" }, 404);

  const fields = "fields" in parsed.data ? parsed.data.fields : [parsed.data];
  for (const field of fields) {
    const valueJson = JSON.stringify(field.value);
    await upsertMemberFieldOverride(db, {
      memberId: mid,
      stableKey: asStableKey(field.stableKey),
      valueJson,
      rawValueJson: valueJson,
      updatedBy: c.var.authUser?.email ?? "unknown",
    });
  }

  return c.json({ ok: true }, 200);
});

// issue-194-03b-followup-001-email-conflict-identity-merge
// admin identity-conflicts route:
//   GET    /admin/identity-conflicts            -> ListIdentityConflictsResponse
//   POST   /admin/identity-conflicts/:id/merge   -> MergeIdentityResponse
//   POST   /admin/identity-conflicts/:id/dismiss -> { dismissedAt }
//
// 不変条件: #5 (D1 直アクセスは apps/api 限定) / #11 (本文編集なし) / #13 (audit logging)
import { Hono } from "hono";
import { z } from "zod";
import {
  MergeIdentityRequestZ,
  DismissIdentityConflictRequestZ,
} from "@ubm-hyogo/shared";
import { requireAdmin, type RequireAuthVariables } from "../../middleware/require-admin";
import { ctx } from "../../repository/_shared/db";
import {
  listIdentityConflicts,
  dismissIdentityConflict,
  parseConflictId,
} from "../../repository/identity-conflict";
import {
  mergeIdentities,
  MergeConflictAlreadyApplied,
  MergeIdentityNotFound,
  MergeSelfReference,
} from "../../repository/identity-merge";
import type { AdminRouteEnv } from "./_shared";

const ListQueryZ = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const createAdminIdentityConflictsRoute = () => {
  const app = new Hono<{ Bindings: AdminRouteEnv; Variables: RequireAuthVariables }>();
  app.use("*", requireAdmin);

  app.get("/identity-conflicts", async (c) => {
    const parsed = ListQueryZ.safeParse({
      cursor: c.req.query("cursor") || undefined,
      limit: c.req.query("limit") || undefined,
    });
    if (!parsed.success) {
      return c.json({ error: "BAD_REQUEST", issues: parsed.error.issues }, 400);
    }
    const out = await listIdentityConflicts(
      ctx(c.env),
      parsed.data.cursor ?? null,
      parsed.data.limit,
    );
    return c.json(out, 200);
  });

  app.post("/identity-conflicts/:id/merge", async (c) => {
    const id = c.req.param("id");
    const ids = parseConflictId(id);
    if (!ids) return c.json({ error: "BAD_CONFLICT_ID" }, 400);
    const body = await c.req.json().catch(() => null);
    const parsed = MergeIdentityRequestZ.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "BAD_REQUEST", issues: parsed.error.issues }, 400);
    }
    if (parsed.data.targetMemberId !== ids.target) {
      return c.json({ error: "TARGET_MEMBER_MISMATCH" }, 400);
    }
    const claims = c.get("authClaims");
    const user = c.get("authUser");
    try {
      const out = await mergeIdentities(ctx(c.env), {
        sourceMemberId: ids.source,
        targetMemberId: ids.target,
        actorAdminId: claims.sub ?? user.memberId ?? "unknown-admin",
        actorAdminEmail: user.email ?? null,
        reason: parsed.data.reason,
      });
      return c.json(out, 200);
    } catch (err) {
      if (err instanceof MergeConflictAlreadyApplied) {
        return c.json({ error: "ALREADY_MERGED" }, 409);
      }
      if (err instanceof MergeIdentityNotFound) {
        return c.json({ error: "MEMBER_NOT_FOUND", memberId: err.memberId }, 404);
      }
      if (err instanceof MergeSelfReference) {
        return c.json({ error: "SELF_REFERENCE" }, 400);
      }
      throw err;
    }
  });

  app.post("/identity-conflicts/:id/dismiss", async (c) => {
    const id = c.req.param("id");
    const ids = parseConflictId(id);
    if (!ids) return c.json({ error: "BAD_CONFLICT_ID" }, 400);
    const body = await c.req.json().catch(() => null);
    const parsed = DismissIdentityConflictRequestZ.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "BAD_REQUEST", issues: parsed.error.issues }, 400);
    }
    const claims = c.get("authClaims");
    const user = c.get("authUser");
    const out = await dismissIdentityConflict(
      ctx(c.env),
      ids.source,
      ids.target,
      claims.sub ?? user.memberId ?? "unknown-admin",
      parsed.data.reason,
    );
    return c.json(out, 200);
  });

  return app;
};
